import Button from './Button'

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  secondaryAction,
  secondaryLabel,
  className,
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 mb-4 rounded-full bg-dark-100 flex items-center justify-center">
          <Icon className="w-8 h-8 text-dark-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-dark-800 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-dark-500 max-w-sm mb-6">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button onClick={action}>
              {actionLabel || 'Thực hiện'}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction}>
              {secondaryLabel || 'Hủy'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default EmptyState

export const EmptyTable = ({ message = 'Không có dữ liệu', action, actionLabel }) => (
  <EmptyState
    icon={() => (
      <svg className="w-12 h-12 text-dark-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )}
    title={message}
    description="Hãy thử thay đổi bộ lọc hoặc tạo mới dữ liệu"
    action={action}
    actionLabel={actionLabel}
  />
)

export const EmptySearch = ({ query }) => (
  <EmptyState
    icon={() => (
      <svg className="w-12 h-12 text-dark-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    )}
    title="Không tìm thấy kết quả"
    description={`Không có kết quả nào phù hợp với "${query}"`}
  />
)
