export default function RequiredProfile({ profile }) {
  if (!profile?.length) return null

  return (
    <div className="bg-surface-container-low p-8 rounded-xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-on-surface font-headline">Required Profile</h2>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-on-surface-variant">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      </div>
      <div className="flex flex-wrap gap-2">
        {profile.map((skill) => (
          <span
            key={skill.skill}
            className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1.5 rounded-full text-xs font-semibold"
          >
            {skill.skill.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
    </div>
  )
}
