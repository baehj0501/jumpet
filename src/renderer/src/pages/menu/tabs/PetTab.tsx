import {
    PET_CATALOG,
    PetSprite,
    useOwnedPets,
    useSelectedPetId,
    useSelectPet,
} from '@renderer/entities/pet'

// 동반 펫 장착 화면 — 보유한 펫만 장착 가능. 잠긴(미보유) 펫은 흐리게 표시되고 뽑기로 해제한다.
export const PetTab = () => {
    const selectedPetId = useSelectedPetId()
    const selectPet = useSelectPet()
    const ownedPets = useOwnedPets()

    return (
        <div className='panel'>
            <div className='hint'>
                보유한 펫을 누르면 캐릭터 옆에 따라다녀요
                <br />
                잠긴 펫은 뽑기에서 열 수 있어요 (보유 {ownedPets.length}/{PET_CATALOG.length})
            </div>

            <div className='pet-grid'>
                {PET_CATALOG.map((pet) => {
                    const owned = ownedPets.includes(pet.id)
                    const equipped = pet.id === selectedPetId
                    const className = equipped
                        ? 'pet-card active'
                        : owned
                          ? 'pet-card'
                          : 'pet-card locked'
                    return (
                        <button
                            type='button'
                            key={pet.id}
                            className={className}
                            disabled={!owned}
                            // 보유한 펫만 장착/해제. 장착된 펫을 다시 누르면 해제('').
                            onClick={() => {
                                if (owned) {
                                    void selectPet(equipped ? '' : pet.id)
                                }
                            }}
                        >
                            <span className='pet-card-sprite'>
                                {owned ? (
                                    <PetSprite
                                        petId={pet.id}
                                        cell={3.5}
                                    />
                                ) : (
                                    <span className='pet-card-lock-icon'>🔒</span>
                                )}
                            </span>
                            <span className='pet-card-name'>{pet.name}</span>
                            {equipped && <span className='pet-card-badge'>장착</span>}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
