/*
  ClubReport Hub demo data seed for SQL Server.

  Run from the repository root after Docker is up:

  PowerShell:
    Get-Content .\docs\seed-demo-data.sql | docker exec -i clubreport-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "ClubReportHub!2026" -C -b

  Bash:
    docker exec -i clubreport-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "ClubReportHub!2026" -C -b < docs/seed-demo-data.sql

  The script is idempotent: it checks for existing demo rows before inserting.
*/

SET NOCOUNT ON;

DECLARE @now datetimeoffset = SYSDATETIMEOFFSET();
DECLARE @adminId int = 1;
DECLARE @managerId int = 2;
DECLARE @studentAffairsId int = 3;
DECLARE @treasurerId int = 4;
DECLARE @memberId int = 5;

DECLARE @RoboticsId int, @MusicId int, @VolunteerId int, @DesignId int, @EsportsId int, @BusinessId int;
SELECT @RoboticsId = Id FROM ClubReportHub_Club.dbo.Clubs WHERE Code = N'ROB';
SELECT @MusicId = Id FROM ClubReportHub_Club.dbo.Clubs WHERE Code = N'MUS';
SELECT @VolunteerId = Id FROM ClubReportHub_Club.dbo.Clubs WHERE Code = N'VOL';

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Club.dbo.Clubs WHERE Code = N'DES')
BEGIN
    INSERT INTO ClubReportHub_Club.dbo.Clubs (Code, Name, Description, ContactEmail, ContactPhone, IsActive, CreatedAtUtc)
    VALUES (N'DES', N'Design Club', N'Creative student club for UI design, branding, poster production, and portfolio reviews.', N'design@university.local', N'0900000004', 1, DATEADD(day, -70, @now));
END
SELECT @DesignId = Id FROM ClubReportHub_Club.dbo.Clubs WHERE Code = N'DES';

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Club.dbo.Clubs WHERE Code = N'ESP')
BEGIN
    INSERT INTO ClubReportHub_Club.dbo.Clubs (Code, Name, Description, ContactEmail, ContactPhone, IsActive, CreatedAtUtc)
    VALUES (N'ESP', N'Esports Club', N'Competitive gaming, tournament operations, and campus broadcast coordination.', N'esports@university.local', N'0900000005', 1, DATEADD(day, -58, @now));
END
SELECT @EsportsId = Id FROM ClubReportHub_Club.dbo.Clubs WHERE Code = N'ESP';

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Club.dbo.Clubs WHERE Code = N'BIZ')
BEGIN
    INSERT INTO ClubReportHub_Club.dbo.Clubs (Code, Name, Description, ContactEmail, ContactPhone, IsActive, CreatedAtUtc)
    VALUES (N'BIZ', N'Entrepreneurship Club', N'Student startup practice space for pitch training, product validation, and demo day preparation.', N'biz@university.local', N'0900000006', 1, DATEADD(day, -45, @now));
END
SELECT @BusinessId = Id FROM ClubReportHub_Club.dbo.Clubs WHERE Code = N'BIZ';

IF @VolunteerId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ClubReportHub_Club.dbo.ClubManagerAssignments WHERE ClubId = @VolunteerId AND ManagerUserId = @managerId AND IsActive = 1)
BEGIN
    INSERT INTO ClubReportHub_Club.dbo.ClubManagerAssignments (ClubId, ManagerUserId, ManagerName, AssignedAtUtc, EndedAtUtc, IsActive)
    VALUES (@VolunteerId, @managerId, N'Demo Club Manager', DATEADD(day, -65, @now), NULL, 1);
END
IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Club.dbo.ClubManagerAssignments WHERE ClubId = @DesignId AND ManagerUserId = @managerId AND IsActive = 1)
BEGIN
    INSERT INTO ClubReportHub_Club.dbo.ClubManagerAssignments (ClubId, ManagerUserId, ManagerName, AssignedAtUtc, EndedAtUtc, IsActive)
    VALUES (@DesignId, @managerId, N'Demo Club Manager', DATEADD(day, -60, @now), NULL, 1);
END
IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Club.dbo.ClubManagerAssignments WHERE ClubId = @EsportsId AND ManagerUserId = @managerId AND IsActive = 1)
BEGIN
    INSERT INTO ClubReportHub_Club.dbo.ClubManagerAssignments (ClubId, ManagerUserId, ManagerName, AssignedAtUtc, EndedAtUtc, IsActive)
    VALUES (@EsportsId, @managerId, N'Demo Club Manager', DATEADD(day, -52, @now), NULL, 1);
END
IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Club.dbo.ClubManagerAssignments WHERE ClubId = @BusinessId AND ManagerUserId = @managerId AND IsActive = 1)
BEGIN
    INSERT INTO ClubReportHub_Club.dbo.ClubManagerAssignments (ClubId, ManagerUserId, ManagerName, AssignedAtUtc, EndedAtUtc, IsActive)
    VALUES (@BusinessId, @managerId, N'Demo Club Manager', DATEADD(day, -42, @now), NULL, 1);
END

DECLARE @DesignActivityId int, @EsportsActivityId int, @BusinessActivityId int, @VolunteerActivityId int, @RoboticsHackathonId int;
IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Activity.dbo.Activities WHERE Title = N'Design Portfolio Review Day')
BEGIN
    INSERT INTO ClubReportHub_Activity.dbo.Activities (ClubId, ClubName, Title, Description, StartTimeUtc, EndTimeUtc, Location, Status, CreatedByUserId, CreatedAtUtc, UpdatedAtUtc)
    VALUES (@DesignId, N'Design Club', N'Design Portfolio Review Day', N'Mentor review session for posters, UI mockups, and member portfolio drafts.', '2026-07-05T02:00:00+00:00', '2026-07-05T05:00:00+00:00', N'FPTU Creative Studio', N'Completed', @managerId, DATEADD(day, -20, @now), DATEADD(day, -2, @now));
END
SELECT @DesignActivityId = Id FROM ClubReportHub_Activity.dbo.Activities WHERE Title = N'Design Portfolio Review Day';

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Activity.dbo.Activities WHERE Title = N'Campus Esports Tryout')
BEGIN
    INSERT INTO ClubReportHub_Activity.dbo.Activities (ClubId, ClubName, Title, Description, StartTimeUtc, EndTimeUtc, Location, Status, CreatedByUserId, CreatedAtUtc, UpdatedAtUtc)
    VALUES (@EsportsId, N'Esports Club', N'Campus Esports Tryout', N'Open registration and team placement for the semester tournament roster.', '2026-07-18T10:00:00+00:00', '2026-07-18T14:00:00+00:00', N'Arena Room A', N'Scheduled', @managerId, DATEADD(day, -12, @now), DATEADD(day, -1, @now));
END
SELECT @EsportsActivityId = Id FROM ClubReportHub_Activity.dbo.Activities WHERE Title = N'Campus Esports Tryout';

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Activity.dbo.Activities WHERE Title = N'Startup Pitch Clinic')
BEGIN
    INSERT INTO ClubReportHub_Activity.dbo.Activities (ClubId, ClubName, Title, Description, StartTimeUtc, EndTimeUtc, Location, Status, CreatedByUserId, CreatedAtUtc, UpdatedAtUtc)
    VALUES (@BusinessId, N'Entrepreneurship Club', N'Startup Pitch Clinic', N'Practice clinic for problem statements, customer validation, and three-minute pitches.', '2026-07-20T09:00:00+00:00', '2026-07-20T12:00:00+00:00', N'Business Lab', N'Scheduled', @managerId, DATEADD(day, -10, @now), DATEADD(day, -1, @now));
END
SELECT @BusinessActivityId = Id FROM ClubReportHub_Activity.dbo.Activities WHERE Title = N'Startup Pitch Clinic';

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Activity.dbo.Activities WHERE Title = N'Green Campus Cleanup')
BEGIN
    INSERT INTO ClubReportHub_Activity.dbo.Activities (ClubId, ClubName, Title, Description, StartTimeUtc, EndTimeUtc, Location, Status, CreatedByUserId, CreatedAtUtc, UpdatedAtUtc)
    VALUES (@VolunteerId, N'Volunteer Club', N'Green Campus Cleanup', N'Campus cleanup route with waste sorting and student volunteer check-in.', '2026-07-04T01:00:00+00:00', '2026-07-04T04:00:00+00:00', N'FPTU Main Yard', N'Completed', @managerId, DATEADD(day, -18, @now), DATEADD(day, -2, @now));
END
SELECT @VolunteerActivityId = Id FROM ClubReportHub_Activity.dbo.Activities WHERE Title = N'Green Campus Cleanup';

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Activity.dbo.Activities WHERE Title = N'Robotics Mini Hackathon 2026')
BEGIN
    INSERT INTO ClubReportHub_Activity.dbo.Activities (ClubId, ClubName, Title, Description, StartTimeUtc, EndTimeUtc, Location, Status, CreatedByUserId, CreatedAtUtc, UpdatedAtUtc)
    VALUES (@RoboticsId, N'Robotics Club', N'Robotics Mini Hackathon 2026', N'Prototype challenge for line-following robots and sensor tuning.', '2026-08-02T02:00:00+00:00', '2026-08-02T09:00:00+00:00', N'Innovation Lab', N'Scheduled', @managerId, DATEADD(day, -8, @now), @now);
END
SELECT @RoboticsHackathonId = Id FROM ClubReportHub_Activity.dbo.Activities WHERE Title = N'Robotics Mini Hackathon 2026';

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Activity.dbo.ActivityParticipants WHERE ActivityId = @DesignActivityId AND UserId = @memberId)
    INSERT INTO ClubReportHub_Activity.dbo.ActivityParticipants (ActivityId, UserId, FullName, AttendanceStatus, RegisteredAtUtc) VALUES (@DesignActivityId, @memberId, N'Demo Club Member', N'Attended', DATEADD(day, -16, @now));
IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Activity.dbo.ActivityParticipants WHERE ActivityId = @EsportsActivityId AND UserId = @memberId)
    INSERT INTO ClubReportHub_Activity.dbo.ActivityParticipants (ActivityId, UserId, FullName, AttendanceStatus, RegisteredAtUtc) VALUES (@EsportsActivityId, @memberId, N'Demo Club Member', N'Registered', DATEADD(day, -5, @now));
IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Activity.dbo.ActivityParticipants WHERE ActivityId = @BusinessActivityId AND UserId = @memberId)
    INSERT INTO ClubReportHub_Activity.dbo.ActivityParticipants (ActivityId, UserId, FullName, AttendanceStatus, RegisteredAtUtc) VALUES (@BusinessActivityId, @memberId, N'Demo Club Member', N'Registered', DATEADD(day, -4, @now));
IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Activity.dbo.ActivityParticipants WHERE ActivityId = @VolunteerActivityId AND UserId = @memberId)
    INSERT INTO ClubReportHub_Activity.dbo.ActivityParticipants (ActivityId, UserId, FullName, AttendanceStatus, RegisteredAtUtc) VALUES (@VolunteerActivityId, @memberId, N'Demo Club Member', N'Attended', DATEADD(day, -14, @now));
IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Activity.dbo.ActivityParticipants WHERE ActivityId = @RoboticsHackathonId AND UserId = @memberId)
    INSERT INTO ClubReportHub_Activity.dbo.ActivityParticipants (ActivityId, UserId, FullName, AttendanceStatus, RegisteredAtUtc) VALUES (@RoboticsHackathonId, @memberId, N'Demo Club Member', N'Registered', DATEADD(day, -3, @now));

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Report.dbo.ReportingDeadlines WHERE Period = N'2026-06')
    INSERT INTO ClubReportHub_Report.dbo.ReportingDeadlines (Period, DueDate, IsActive) VALUES (N'2026-06', '2026-06-25', 1);
IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Report.dbo.ReportingDeadlines WHERE Period = N'2026-09')
    INSERT INTO ClubReportHub_Report.dbo.ReportingDeadlines (Period, DueDate, IsActive) VALUES (N'2026-09', '2026-09-25', 1);

DECLARE @ReportId int;
IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Report.dbo.Reports WHERE ClubId = @DesignId AND Period = N'2026-07')
BEGIN
    INSERT INTO ClubReportHub_Report.dbo.Reports (ClubId, ClubName, Period, Status, CreatedByUserId, DueDate, CreatedAtUtc, UpdatedAtUtc, SubmittedAtUtc, ReviewedAtUtc, ReviewedByUserId, Version)
    VALUES (@DesignId, N'Design Club', N'2026-07', N'Approved', @managerId, '2026-07-25', DATEADD(day, -9, @now), DATEADD(day, -2, @now), DATEADD(day, -6, @now), DATEADD(day, -2, @now), @adminId, 2);
    SET @ReportId = SCOPE_IDENTITY();
    INSERT INTO ClubReportHub_Report.dbo.ReportDetails (ReportId, ActivityName, ActivityDate, Description, ParticipantCount, Outcome) VALUES
        (@ReportId, N'Design Portfolio Review Day', '2026-07-05', N'Reviewed poster systems, landing page drafts, and member portfolios.', 72, N'18 portfolios received mentor feedback and 9 designs were selected for showcase.'),
        (@ReportId, N'Branding Sprint', '2026-07-12', N'Prepared visual identity kits for upcoming club events.', 38, N'Completed reusable poster template package for club communication.');
    INSERT INTO ClubReportHub_Report.dbo.ReportAttachments (ReportId, ReportDetailId, FileName, ContentType, SizeBytes, StoragePath, UploadedAtUtc)
    VALUES (@ReportId, NULL, N'design-july-evidence.pdf', N'application/pdf', 482391, N'/app/attachments/demo/design-july-evidence.pdf', DATEADD(day, -6, @now));
    INSERT INTO ClubReportHub_Report.dbo.ReportFeedback (ReportId, ReviewerUserId, ReviewerName, Decision, Message, CreatedAtUtc)
    VALUES (@ReportId, @adminId, N'System Administrator', N'Approved', N'Evidence is complete and KPI activity counts are valid.', DATEADD(day, -2, @now));
    INSERT INTO ClubReportHub_Report.dbo.AuditLogs (ReportId, Action, ActorUserId, Description, CreatedAtUtc)
    VALUES (@ReportId, N'Approved', @adminId, N'Demo approved report inserted for July KPI leaderboard.', DATEADD(day, -2, @now));
END

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Report.dbo.Reports WHERE ClubId = @MusicId AND Period = N'2026-07')
BEGIN
    INSERT INTO ClubReportHub_Report.dbo.Reports (ClubId, ClubName, Period, Status, CreatedByUserId, DueDate, CreatedAtUtc, UpdatedAtUtc, SubmittedAtUtc, ReviewedAtUtc, ReviewedByUserId, Version)
    VALUES (@MusicId, N'Music Club', N'2026-07', N'Approved', @managerId, '2026-07-25', DATEADD(day, -11, @now), DATEADD(day, -3, @now), DATEADD(day, -7, @now), DATEADD(day, -3, @now), @studentAffairsId, 1);
    SET @ReportId = SCOPE_IDENTITY();
    INSERT INTO ClubReportHub_Report.dbo.ReportDetails (ReportId, ActivityName, ActivityDate, Description, ParticipantCount, Outcome) VALUES
        (@ReportId, N'Acoustic Night Rehearsal', '2026-07-15', N'Rehearsed setlist and checked audio setup for student event.', 55, N'Finalized 8 performances and assigned stage crew.'),
        (@ReportId, N'Member Vocal Workshop', '2026-07-21', N'Workshop for new vocalist onboarding and performance confidence.', 34, N'New members completed practice evaluations.');
    INSERT INTO ClubReportHub_Report.dbo.ReportAttachments (ReportId, ReportDetailId, FileName, ContentType, SizeBytes, StoragePath, UploadedAtUtc)
    VALUES (@ReportId, NULL, N'music-july-photos.zip', N'application/zip', 820124, N'/app/attachments/demo/music-july-photos.zip', DATEADD(day, -7, @now));
    INSERT INTO ClubReportHub_Report.dbo.ReportFeedback (ReportId, ReviewerUserId, ReviewerName, Decision, Message, CreatedAtUtc)
    VALUES (@ReportId, @studentAffairsId, N'Student Affairs Admin', N'Approved', N'Activity evidence and participant summary are acceptable.', DATEADD(day, -3, @now));
END

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Report.dbo.Reports WHERE ClubId = @VolunteerId AND Period = N'2026-07')
BEGIN
    INSERT INTO ClubReportHub_Report.dbo.Reports (ClubId, ClubName, Period, Status, CreatedByUserId, DueDate, CreatedAtUtc, UpdatedAtUtc, SubmittedAtUtc, ReviewedAtUtc, ReviewedByUserId, Version)
    VALUES (@VolunteerId, N'Volunteer Club', N'2026-07', N'Approved', @managerId, '2026-07-25', DATEADD(day, -10, @now), DATEADD(day, -1, @now), DATEADD(day, -5, @now), DATEADD(day, -1, @now), @adminId, 1);
    SET @ReportId = SCOPE_IDENTITY();
    INSERT INTO ClubReportHub_Report.dbo.ReportDetails (ReportId, ActivityName, ActivityDate, Description, ParticipantCount, Outcome) VALUES
        (@ReportId, N'Green Campus Cleanup', '2026-07-04', N'Campus cleanup and waste sorting support.', 96, N'Collected 42 bags of recyclable and general waste.'),
        (@ReportId, N'Community Outreach Briefing', '2026-07-09', N'Prepared teams for local community support visits.', 41, N'Assigned volunteers and completed safety briefing.');
    INSERT INTO ClubReportHub_Report.dbo.ReportAttachments (ReportId, ReportDetailId, FileName, ContentType, SizeBytes, StoragePath, UploadedAtUtc)
    VALUES (@ReportId, NULL, N'volunteer-july-attendance.xlsx', N'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 110392, N'/app/attachments/demo/volunteer-july-attendance.xlsx', DATEADD(day, -5, @now));
    INSERT INTO ClubReportHub_Report.dbo.ReportFeedback (ReportId, ReviewerUserId, ReviewerName, Decision, Message, CreatedAtUtc)
    VALUES (@ReportId, @adminId, N'System Administrator', N'Approved', N'High engagement event with complete attendance evidence.', DATEADD(day, -1, @now));
END

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Report.dbo.Reports WHERE ClubId = @EsportsId AND Period = N'2026-07')
BEGIN
    INSERT INTO ClubReportHub_Report.dbo.Reports (ClubId, ClubName, Period, Status, CreatedByUserId, DueDate, CreatedAtUtc, UpdatedAtUtc, SubmittedAtUtc, ReviewedAtUtc, ReviewedByUserId, Version)
    VALUES (@EsportsId, N'Esports Club', N'2026-07', N'Submitted', @managerId, '2026-07-25', DATEADD(day, -4, @now), DATEADD(day, -1, @now), DATEADD(day, -1, @now), NULL, NULL, 1);
    SET @ReportId = SCOPE_IDENTITY();
    INSERT INTO ClubReportHub_Report.dbo.ReportDetails (ReportId, ActivityName, ActivityDate, Description, ParticipantCount, Outcome)
    VALUES (@ReportId, N'Campus Esports Tryout', '2026-07-18', N'Open tryout registration and team matching plan.', 64, N'Pending final review from Student Affairs.');
    INSERT INTO ClubReportHub_Report.dbo.ReportAttachments (ReportId, ReportDetailId, FileName, ContentType, SizeBytes, StoragePath, UploadedAtUtc)
    VALUES (@ReportId, NULL, N'esports-tryout-registration.xlsx', N'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 93321, N'/app/attachments/demo/esports-tryout-registration.xlsx', DATEADD(day, -1, @now));
END

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Report.dbo.Reports WHERE ClubId = @BusinessId AND Period = N'2026-07')
BEGIN
    INSERT INTO ClubReportHub_Report.dbo.Reports (ClubId, ClubName, Period, Status, CreatedByUserId, DueDate, CreatedAtUtc, UpdatedAtUtc, SubmittedAtUtc, ReviewedAtUtc, ReviewedByUserId, Version)
    VALUES (@BusinessId, N'Entrepreneurship Club', N'2026-07', N'Under Review', @managerId, '2026-07-25', DATEADD(day, -5, @now), @now, DATEADD(day, -2, @now), @now, @studentAffairsId, 1);
    SET @ReportId = SCOPE_IDENTITY();
    INSERT INTO ClubReportHub_Report.dbo.ReportDetails (ReportId, ActivityName, ActivityDate, Description, ParticipantCount, Outcome)
    VALUES (@ReportId, N'Startup Pitch Clinic', '2026-07-20', N'Pitch training and product validation session.', 46, N'Review in progress for evidence completeness.');
    INSERT INTO ClubReportHub_Report.dbo.ReportFeedback (ReportId, ReviewerUserId, ReviewerName, Decision, Message, CreatedAtUtc)
    VALUES (@ReportId, @studentAffairsId, N'Student Affairs Admin', N'Under Review', N'Please verify participant list before approval.', @now);
END

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Report.dbo.Reports WHERE ClubId = @RoboticsId AND Period = N'2026-06')
BEGIN
    INSERT INTO ClubReportHub_Report.dbo.Reports (ClubId, ClubName, Period, Status, CreatedByUserId, DueDate, CreatedAtUtc, UpdatedAtUtc, SubmittedAtUtc, ReviewedAtUtc, ReviewedByUserId, Version)
    VALUES (@RoboticsId, N'Robotics Club', N'2026-06', N'Approved', @managerId, '2026-06-25', DATEADD(day, -34, @now), DATEADD(day, -28, @now), DATEADD(day, -31, @now), DATEADD(day, -28, @now), @adminId, 1);
    SET @ReportId = SCOPE_IDENTITY();
    INSERT INTO ClubReportHub_Report.dbo.ReportDetails (ReportId, ActivityName, ActivityDate, Description, ParticipantCount, Outcome) VALUES
        (@ReportId, N'Sensor Calibration Lab', '2026-06-12', N'Calibration practice for line follower robot sensors.', 39, N'Members completed baseline calibration checklist.'),
        (@ReportId, N'Mini Robot Demo', '2026-06-22', N'Internal demo day for prototype robots.', 44, N'Four teams presented working prototypes.');
    INSERT INTO ClubReportHub_Report.dbo.ReportFeedback (ReportId, ReviewerUserId, ReviewerName, Decision, Message, CreatedAtUtc)
    VALUES (@ReportId, @adminId, N'System Administrator', N'Approved', N'June report approved with complete activity outcomes.', DATEADD(day, -28, @now));
END

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Report.dbo.Reports WHERE ClubId = @VolunteerId AND Period = N'2026-05')
BEGIN
    INSERT INTO ClubReportHub_Report.dbo.Reports (ClubId, ClubName, Period, Status, CreatedByUserId, DueDate, CreatedAtUtc, UpdatedAtUtc, SubmittedAtUtc, ReviewedAtUtc, ReviewedByUserId, Version)
    VALUES (@VolunteerId, N'Volunteer Club', N'2026-05', N'Rejected', @managerId, '2026-05-25', DATEADD(day, -62, @now), DATEADD(day, -50, @now), DATEADD(day, -55, @now), DATEADD(day, -50, @now), @adminId, 1);
    SET @ReportId = SCOPE_IDENTITY();
    INSERT INTO ClubReportHub_Report.dbo.ReportDetails (ReportId, ActivityName, ActivityDate, Description, ParticipantCount, Outcome)
    VALUES (@ReportId, N'Community Supply Sorting', '2026-05-20', N'Supplies were sorted but evidence was incomplete.', 27, N'Resubmission required with signed attendance sheet.');
    INSERT INTO ClubReportHub_Report.dbo.ReportFeedback (ReportId, ReviewerUserId, ReviewerName, Decision, Message, CreatedAtUtc)
    VALUES (@ReportId, @adminId, N'System Administrator', N'Rejected', N'Missing signed attendance and photo evidence.', DATEADD(day, -50, @now));
END

DECLARE @ProposalId int;
IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Finance.dbo.BudgetProposals WHERE Title = N'Design showcase printing')
BEGIN
    INSERT INTO ClubReportHub_Finance.dbo.BudgetProposals (ClubId, ClubName, ActivityId, Title, Description, RequestedAmount, ApprovedAmount, Status, ProposedByUserId, ProposedAtUtc, ReviewedByUserId, ReviewedAtUtc, ReviewNote)
    VALUES (@DesignId, N'Design Club', @DesignActivityId, N'Design showcase printing', N'Poster printing, badge cards, and foam board for portfolio showcase.', 3200000, 3000000, N'Approved', @treasurerId, DATEADD(day, -7, @now), @adminId, DATEADD(day, -3, @now), N'Approved with small reduction for printing package.');
    SET @ProposalId = SCOPE_IDENTITY();
    INSERT INTO ClubReportHub_Finance.dbo.FinanceTransactions (ClubId, Amount, Type, Description, ReferenceId, TransactionDateUtc)
    VALUES (@DesignId, 3000000, N'BudgetApproved', N'Design showcase printing budget approved.', @ProposalId, DATEADD(day, -3, @now));
END

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Finance.dbo.BudgetProposals WHERE Title = N'Esports tournament prize pool')
BEGIN
    INSERT INTO ClubReportHub_Finance.dbo.BudgetProposals (ClubId, ClubName, ActivityId, Title, Description, RequestedAmount, ApprovedAmount, Status, ProposedByUserId, ProposedAtUtc, ReviewedByUserId, ReviewedAtUtc, ReviewNote)
    VALUES (@EsportsId, N'Esports Club', @EsportsActivityId, N'Esports tournament prize pool', N'Prize pool, referee snacks, and streaming overlay package.', 5200000, NULL, N'Submitted', @treasurerId, DATEADD(day, -2, @now), NULL, NULL, NULL);
END

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Finance.dbo.BudgetProposals WHERE Title = N'Volunteer cleanup supplies')
BEGIN
    INSERT INTO ClubReportHub_Finance.dbo.BudgetProposals (ClubId, ClubName, ActivityId, Title, Description, RequestedAmount, ApprovedAmount, Status, ProposedByUserId, ProposedAtUtc, ReviewedByUserId, ReviewedAtUtc, ReviewNote)
    VALUES (@VolunteerId, N'Volunteer Club', @VolunteerActivityId, N'Volunteer cleanup supplies', N'Gloves, trash bags, water, and route signage for cleanup event.', 1800000, 1800000, N'Settled', @treasurerId, DATEADD(day, -12, @now), @adminId, DATEADD(day, -9, @now), N'Approved for community support event.');
    SET @ProposalId = SCOPE_IDENTITY();
    INSERT INTO ClubReportHub_Finance.dbo.Settlements (BudgetProposalId, TotalSpent, ReceiptUrl, Status, SubmittedAtUtc, ReviewedByUserId, ReviewedAtUtc, ReviewNote)
    VALUES (@ProposalId, 1725000, N'https://example.local/receipts/volunteer-cleanup.pdf', N'Approved', DATEADD(day, -5, @now), @adminId, DATEADD(day, -2, @now), N'Receipts match approved event scope.');
    INSERT INTO ClubReportHub_Finance.dbo.FinanceTransactions (ClubId, Amount, Type, Description, ReferenceId, TransactionDateUtc) VALUES
        (@VolunteerId, 1800000, N'BudgetApproved', N'Volunteer cleanup supplies budget approved.', @ProposalId, DATEADD(day, -9, @now)),
        (@VolunteerId, 1725000, N'SettlementApproved', N'Volunteer cleanup supplies settlement approved.', @ProposalId, DATEADD(day, -2, @now));
END

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Finance.dbo.BudgetProposals WHERE Title = N'Startup demo booth package')
BEGIN
    INSERT INTO ClubReportHub_Finance.dbo.BudgetProposals (ClubId, ClubName, ActivityId, Title, Description, RequestedAmount, ApprovedAmount, Status, ProposedByUserId, ProposedAtUtc, ReviewedByUserId, ReviewedAtUtc, ReviewNote)
    VALUES (@BusinessId, N'Entrepreneurship Club', @BusinessActivityId, N'Startup demo booth package', N'Backdrop, standee, pitch timer, and visitor feedback cards for demo booth.', 4100000, NULL, N'Submitted', @treasurerId, DATEADD(day, -1, @now), NULL, NULL, NULL);
END

DECLARE @ExportId int;
IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Export.dbo.ExportRequests WHERE ExportType = N'PDF' AND Scope = N'Consolidated' AND Period = N'2026-07')
BEGIN
    INSERT INTO ClubReportHub_Export.dbo.ExportRequests (ExportType, Scope, Status, Period, ClubId, RequestedByUserId, RequestedByName, CriteriaJson, ErrorMessage, CreatedAtUtc, CompletedAtUtc)
    VALUES (N'PDF', N'Consolidated', N'Completed', N'2026-07', NULL, @studentAffairsId, N'Student Affairs Admin', N'{"period":"2026-07","scope":"all-clubs"}', NULL, DATEADD(day, -2, @now), DATEADD(day, -2, @now));
    SET @ExportId = SCOPE_IDENTITY();
    INSERT INTO ClubReportHub_Export.dbo.ExportFiles (ExportRequestId, FileName, ContentType, FilePath, SizeBytes, ExpiresAtUtc, Checksum, IsAvailable)
    VALUES (@ExportId, N'club-report-2026-07.pdf', N'application/pdf', N'/app/exports/club-report-2026-07.pdf', 938412, DATEADD(day, 30, @now), N'demo-pdf-202607', 1);
END

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Export.dbo.ExportRequests WHERE ExportType = N'EXCEL' AND Scope = N'KPI Leaderboard' AND Period = N'2026-07')
BEGIN
    INSERT INTO ClubReportHub_Export.dbo.ExportRequests (ExportType, Scope, Status, Period, ClubId, RequestedByUserId, RequestedByName, CriteriaJson, ErrorMessage, CreatedAtUtc, CompletedAtUtc)
    VALUES (N'EXCEL', N'KPI Leaderboard', N'Completed', N'2026-07', NULL, @adminId, N'System Administrator', N'{"period":"2026-07","type":"kpi"}', NULL, DATEADD(day, -1, @now), DATEADD(hour, -18, @now));
    SET @ExportId = SCOPE_IDENTITY();
    INSERT INTO ClubReportHub_Export.dbo.ExportFiles (ExportRequestId, FileName, ContentType, FilePath, SizeBytes, ExpiresAtUtc, Checksum, IsAvailable)
    VALUES (@ExportId, N'kpi-leaderboard-2026-07.xlsx', N'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', N'/app/exports/kpi-leaderboard-2026-07.xlsx', 184221, DATEADD(day, 30, @now), N'demo-xlsx-202607', 1);
END

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Export.dbo.ExportRequests WHERE ExportType = N'PDF' AND Scope = N'Finance Summary' AND Period = N'2026-07')
BEGIN
    INSERT INTO ClubReportHub_Export.dbo.ExportRequests (ExportType, Scope, Status, Period, ClubId, RequestedByUserId, RequestedByName, CriteriaJson, ErrorMessage, CreatedAtUtc, CompletedAtUtc)
    VALUES (N'PDF', N'Finance Summary', N'Queued', N'2026-07', NULL, @adminId, N'System Administrator', N'{"period":"2026-07","type":"finance"}', NULL, @now, NULL);
END

IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Notification.dbo.Notifications WHERE Title = N'July reports ready for review')
    INSERT INTO ClubReportHub_Notification.dbo.Notifications (RecipientUserId, RecipientRole, EventType, Title, Message, IsRead, CreatedAtUtc) VALUES (NULL, N'ADMIN', N'Report', N'July reports ready for review', N'Several club reports are submitted or under review for period 2026-07.', 0, DATEADD(hour, -8, @now));
IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Notification.dbo.Notifications WHERE Title = N'KPI leaderboard recalculated')
    INSERT INTO ClubReportHub_Notification.dbo.Notifications (RecipientUserId, RecipientRole, EventType, Title, Message, IsRead, CreatedAtUtc) VALUES (NULL, N'STUDENT_AFFAIRS_ADMIN', N'KPI', N'KPI leaderboard recalculated', N'July KPI ranking now includes approved Design, Music, and Volunteer reports.', 0, DATEADD(hour, -6, @now));
IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Notification.dbo.Notifications WHERE Title = N'Design Club report approved')
    INSERT INTO ClubReportHub_Notification.dbo.Notifications (RecipientUserId, RecipientRole, EventType, Title, Message, IsRead, CreatedAtUtc) VALUES (@managerId, N'CLUB_MANAGER', N'Report', N'Design Club report approved', N'Your July report for Design Club was approved and added to KPI scoring.', 0, DATEADD(hour, -5, @now));
IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Notification.dbo.Notifications WHERE Title = N'Budget settlement approved')
    INSERT INTO ClubReportHub_Notification.dbo.Notifications (RecipientUserId, RecipientRole, EventType, Title, Message, IsRead, CreatedAtUtc) VALUES (@treasurerId, N'TREASURER', N'Finance', N'Budget settlement approved', N'Volunteer cleanup supplies settlement has been approved.', 0, DATEADD(hour, -3, @now));
IF NOT EXISTS (SELECT 1 FROM ClubReportHub_Notification.dbo.Notifications WHERE Title = N'You are registered for Campus Esports Tryout')
    INSERT INTO ClubReportHub_Notification.dbo.Notifications (RecipientUserId, RecipientRole, EventType, Title, Message, IsRead, CreatedAtUtc) VALUES (@memberId, N'CLUB_MEMBER', N'Activity', N'You are registered for Campus Esports Tryout', N'Your registration is confirmed for the esports tryout on 2026-07-18.', 0, DATEADD(hour, -2, @now));

SELECT N'ClubReportHub_Club.Clubs' AS [Table], COUNT(*) AS [Rows] FROM ClubReportHub_Club.dbo.Clubs
UNION ALL SELECT N'ClubReportHub_Activity.Activities', COUNT(*) FROM ClubReportHub_Activity.dbo.Activities
UNION ALL SELECT N'ClubReportHub_Report.Reports', COUNT(*) FROM ClubReportHub_Report.dbo.Reports
UNION ALL SELECT N'ClubReportHub_Finance.BudgetProposals', COUNT(*) FROM ClubReportHub_Finance.dbo.BudgetProposals
UNION ALL SELECT N'ClubReportHub_Export.ExportRequests', COUNT(*) FROM ClubReportHub_Export.dbo.ExportRequests
UNION ALL SELECT N'ClubReportHub_Notification.Notifications', COUNT(*) FROM ClubReportHub_Notification.dbo.Notifications;
