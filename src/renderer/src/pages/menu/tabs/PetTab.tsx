import { PET_CATALOG, PetSprite, useSelectedPetId, useSelectPet } from '@renderer/entities/pet'

// 동반 펫 장착 화면 — 카드를 누르면 캐릭터 옆에 따라다니는 펫으로 장착(같은 펫 다시 누르면 해제).
export const PetTab = () => {
    const selectedPetId = useSelectedPetId()
    const selectPet = useSelectPet()

    return (
        <div className='panel'>
            <div className='hint'>
                펫을 누르면 캐릭터 옆에 따라다녀요
                <br />
                장착된 펫을 다시 누르면 해제돼요
            </div>

            <div className='pet-grid'>
                {PET_CATALOG.map((pet) => {
                    const equipped = pet.id === selectedPetId
                    return (
                        <button
                            type='button'
                            key={pet.id}
                            className={equipped ? 'pet-card active' : 'pet-card'}
                            // 장착된 펫을 다시 누르면 해제('').
                            onClick={() => void selectPet(equipped ? '' : pet.id)}
                        >
                            <span className='pet-card-sprite'>
                                <PetSprite
                                    petId={pet.id}
                                    cell={3.5}
                                />
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
