export default function CandidateProfile({ profile }) {
  if (!profile?.length) return null

  return (
    <div className="bg-surface-container-low p-8 rounded-xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-on-surface font-headline">Your Profile</h2>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-on-surface-variant">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <div className="flex flex-wrap gap-2">
        {profile.map((skill) => (
          <span
            key={skill.skill}
            className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-semibold"
          >
            {skill.skill.replace(/_/g, ' ')}
            {skill.level > 0 && (
              <span className="opacity-60 ml-1">
                ({['', 'Novice', 'Intermediate', 'Advanced', 'Expert'][skill.level] || `L${skill.level}`})
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
