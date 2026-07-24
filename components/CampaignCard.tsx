import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  MEDICAL_EMERGENCY: 'Medical',
  ACADEMIC_FEES: 'Academic',
  ORPHANAGE: 'Orphanage',
  OLD_HOME: 'Old Home',
  COMMUNITY_SERVICE: 'Community',
  DISASTER_RELIEF: 'Disaster',
  STUDENT_WELFARE: 'Student',
  OTHER: 'Other',
}

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: 'badge-green',
  PENDING: 'badge-yellow',
  COMPLETED: 'badge-blue',
  EXPIRED: 'badge-gray',
  REJECTED: 'badge-red',
}

interface Campaign {
  id: string; title: string; description: string; category: string;
  customCategory?: string; goalAmount?: number; remainingAmount?: number;
  status: string; deadline: string; imageUrl?: string;
  user: { name: string; id: string }; createdAt: string;
}

function daysRemaining(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function CampaignCard({ campaign }: { campaign: Campaign }) {
  const days = daysRemaining(campaign.deadline)
  const label = campaign.category === 'OTHER' && campaign.customCategory
    ? campaign.customCategory
    : CATEGORY_LABELS[campaign.category] || campaign.category

  const pct = campaign.goalAmount && campaign.remainingAmount != null
    ? Math.min(100, Math.round(((campaign.goalAmount - campaign.remainingAmount) / campaign.goalAmount) * 100))
    : null

  return (
    <Link href={`/campaigns/${campaign.id}`} style={{ display: 'block', height: '100%' }}>
      <div className="card campaign-card">
        <div className="campaign-card-img">
          {campaign.imageUrl
            ? <img src={campaign.imageUrl} alt={campaign.title} />
            : <div className="campaign-card-img-placeholder" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>{label}</div>
          }
          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <span className={`badge ${STATUS_CLASS[campaign.status] || 'badge-gray'}`}>{campaign.status}</span>
          </div>
        </div>
        <div className="campaign-card-body">
          <div>
            <span className="badge badge-purple" style={{ marginBottom: 8 }}>{label}</span>
            <div className="campaign-card-title">{campaign.title}</div>
            <p className="campaign-card-desc">{campaign.description.replace(/<[^>]+>/g, '')}</p>
          </div>
          {pct !== null && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                <span>{pct}% raised</span>
                {campaign.remainingAmount && <span>PKR {campaign.remainingAmount.toLocaleString()} needed</span>}
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
            </div>
          )}
          <div className="campaign-card-meta">
            <span className="campaign-card-author">by {campaign.user.name}</span>
            <span className={`campaign-card-deadline ${days <= 3 ? 'urgent' : ''}`}>
              {days === 0 ? 'Expires today' : `${days}d left`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
