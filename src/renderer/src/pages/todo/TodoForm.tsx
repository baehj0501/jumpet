import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

type TodoFormProps = {
    // 빈 문자열은 store 측에서 무시되지만, 여기서도 UX 상 제출 자체를 막는다.
    onAdd: (text: string) => void
}

// 새 할 일 입력창. 창이 열리면 자동 포커스되어 곧바로 타이핑 가능.
export const TodoForm = ({ onAdd }: TodoFormProps) => {
    const [text, setText] = useState('')

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setText(event.target.value)
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (text.trim() === '') {
            return
        }
        onAdd(text)
        setText('')
    }

    return (
        <form
            className='todo-form'
            onSubmit={handleSubmit}
        >
            <input
                type='text'
                value={text}
                onChange={handleChange}
                placeholder='할 일을 입력하세요'
                aria-label='새 할 일'
                autoFocus
            />
        </form>
    )
}
