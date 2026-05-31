type PlaceholderTabProps = {
    icon: string
    label: string
}

export const PlaceholderTab = ({ icon, label }: PlaceholderTabProps) => {
    return (
        <div className='panel'>
            <div className='placeholder'>
                <span className='big'>{icon}</span>
                <span>{label}</span>
                <span>준비 중이에요!</span>
            </div>
        </div>
    )
}
