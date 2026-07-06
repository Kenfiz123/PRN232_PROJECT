using System.Text;
using System.Text.Json;
using ClubReportHub.Shared.Auth;
using ClubReportHub.Shared.Messaging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NotificationService.Data;
using NotificationService.Models;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace NotificationService.Consumers;

public sealed class RabbitMqNotificationConsumer(
    IServiceScopeFactory scopeFactory,
    IOptions<RabbitMqOptions> options,
    ILogger<RabbitMqNotificationConsumer> logger) : BackgroundService
{
    private readonly RabbitMqOptions _options = options.Value;
    private IConnection? _connection;
    private IModel? _channel;

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            var factory = new ConnectionFactory
            {
                HostName = _options.HostName,
                Port = _options.Port,
                UserName = _options.UserName,
                Password = _options.Password,
                DispatchConsumersAsync = false
            };

            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();
            _channel.ExchangeDeclare(_options.ExchangeName, ExchangeType.Topic, durable: true, autoDelete: false);
            _channel.ExchangeDeclare($"{_options.ExchangeName}.dead", ExchangeType.Topic, durable: true, autoDelete: false);
            _channel.QueueDeclare(
                queue: "notification-service",
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: new Dictionary<string, object> { ["x-dead-letter-exchange"] = $"{_options.ExchangeName}.dead" });
            _channel.QueueDeclare("notification-service.dead", durable: true, exclusive: false, autoDelete: false);
            _channel.QueueBind("notification-service.dead", $"{_options.ExchangeName}.dead", "#");

            foreach (var key in new[]
            {
                EventRoutingKeys.UserRegistered,
                EventRoutingKeys.ClubCreated,
                EventRoutingKeys.ActivityCreated,
                EventRoutingKeys.ReportSubmitted,
                EventRoutingKeys.ReportApproved,
                EventRoutingKeys.ReportRejected,
                EventRoutingKeys.KpiCalculated,
                EventRoutingKeys.BudgetProposalSubmitted,
                EventRoutingKeys.BudgetApproved,
                EventRoutingKeys.SettlementOverdue,
                EventRoutingKeys.ExportCompleted,
                EventRoutingKeys.ReportDeadlineReminder
            })
            {
                _channel.QueueBind("notification-service", _options.ExchangeName, key);
            }

            _channel.BasicQos(0, 5, false);
            var consumer = new EventingBasicConsumer(_channel);
            consumer.Received += (_, args) =>
            {
                try
                {
                    ProcessMessageAsync(args, stoppingToken).GetAwaiter().GetResult();
                    _channel.BasicAck(args.DeliveryTag, multiple: false);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to process RabbitMQ message {DeliveryTag}", args.DeliveryTag);
                    _channel.BasicNack(args.DeliveryTag, multiple: false, requeue: false);
                }
            };

            _channel.BasicConsume("notification-service", autoAck: false, consumer);
            logger.LogInformation("Notification consumer started on RabbitMQ queue notification-service");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "RabbitMQ consumer could not start. Notification API will continue without live events.");
        }

        return Task.CompletedTask;
    }

    public override void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
        base.Dispose();
    }

    private async Task ProcessMessageAsync(BasicDeliverEventArgs args, CancellationToken cancellationToken)
    {
        var payload = Encoding.UTF8.GetString(args.Body.ToArray());
        using var document = JsonDocument.Parse(payload);
        var root = document.RootElement;
        var eventId = root.TryGetProperty("eventId", out var eventIdElement)
            ? eventIdElement.GetGuid()
            : Guid.NewGuid();
        var routingKey = args.RoutingKey;

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
        if (await db.ProcessedEvents.AnyAsync(x => x.EventId == eventId, cancellationToken))
        {
            return;
        }

        var notification = CreateNotification(routingKey, root);
        db.Notifications.Add(notification);
        db.ProcessedEvents.Add(new ProcessedEvent { EventId = eventId, RoutingKey = routingKey });
        await db.SaveChangesAsync(cancellationToken);
    }

    private static Notification CreateNotification(string routingKey, JsonElement root)
    {
        return routingKey switch
        {
            EventRoutingKeys.ClubCreated => new Notification
            {
                RecipientRole = AuthRoles.Admin,
                EventType = routingKey,
                Title = "New club created",
                Message = $"{GetString(root, "clubName")} ({GetString(root, "clubCode")}) is now available."
            },
            EventRoutingKeys.UserRegistered => new Notification
            {
                RecipientUserId = GetInt(root, "userId"),
                EventType = routingKey,
                Title = "Welcome to FCMRH",
                Message = $"Welcome {GetString(root, "fullName")}. Your club account is ready."
            },
            EventRoutingKeys.ActivityCreated => new Notification
            {
                RecipientRole = AuthRoles.ClubMember,
                EventType = routingKey,
                Title = "New club activity",
                Message = $"{GetString(root, "clubName")} scheduled {GetString(root, "title")}."
            },
            EventRoutingKeys.ReportSubmitted => new Notification
            {
                RecipientRole = AuthRoles.Admin,
                EventType = routingKey,
                Title = "Report submitted",
                Message = $"{GetString(root, "clubName")} submitted report {GetString(root, "period")}."
            },
            EventRoutingKeys.ReportApproved => new Notification
            {
                RecipientRole = AuthRoles.ClubManager,
                EventType = routingKey,
                Title = "Report approved",
                Message = $"{GetString(root, "clubName")} report {GetString(root, "period")} was approved."
            },
            EventRoutingKeys.ReportRejected => new Notification
            {
                RecipientRole = AuthRoles.ClubManager,
                EventType = routingKey,
                Title = "Report rejected",
                Message = $"{GetString(root, "clubName")} report {GetString(root, "period")} needs revision: {GetString(root, "feedback")}"
            },
            EventRoutingKeys.KpiCalculated => new Notification
            {
                RecipientRole = AuthRoles.ClubManager,
                EventType = routingKey,
                Title = "KPI calculated",
                Message = $"{GetString(root, "clubName")} KPI for {GetString(root, "period")} is {GetString(root, "points")} points."
            },
            EventRoutingKeys.BudgetProposalSubmitted => new Notification
            {
                RecipientRole = AuthRoles.StudentAffairsAdmin,
                EventType = routingKey,
                Title = "Budget proposal submitted",
                Message = $"{GetString(root, "clubName")} requested {GetString(root, "requestedAmount")} VND."
            },
            EventRoutingKeys.BudgetApproved => new Notification
            {
                RecipientRole = AuthRoles.Treasurer,
                EventType = routingKey,
                Title = "Budget approved",
                Message = $"{GetString(root, "clubName")} budget was approved for {GetString(root, "approvedAmount")} VND."
            },
            EventRoutingKeys.SettlementOverdue => new Notification
            {
                RecipientRole = AuthRoles.Treasurer,
                EventType = routingKey,
                Title = "Settlement overdue",
                Message = $"{GetString(root, "clubName")} has an overdue settlement for proposal #{GetString(root, "proposalId")}."
            },
            EventRoutingKeys.ExportCompleted => new Notification
            {
                RecipientUserId = GetInt(root, "requestedByUserId"),
                EventType = routingKey,
                Title = "Export completed",
                Message = $"Your {GetString(root, "exportType")} export is ready: {GetString(root, "fileName")}."
            },
            EventRoutingKeys.ReportDeadlineReminder => new Notification
            {
                RecipientRole = AuthRoles.Admin,
                EventType = routingKey,
                Title = "Deadline reminder",
                Message = $"Period {GetString(root, "period")} has clubs missing submissions."
            },
            _ => new Notification
            {
                RecipientRole = AuthRoles.Admin,
                EventType = routingKey,
                Title = "System event",
                Message = "A system event was received."
            }
        };
    }

    private static string GetString(JsonElement root, string property)
    {
        return root.TryGetProperty(property, out var value) ? value.ToString() : string.Empty;
    }

    private static int? GetInt(JsonElement root, string property)
    {
        return root.TryGetProperty(property, out var value) && value.TryGetInt32(out var number) ? number : null;
    }
}
