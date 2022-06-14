export function createButton(label, onClick) {
    const button = document.createElement('button')
    button.classList.add('button')
    button.innerText = label
    button.addEventListener('click', onClick)

    return button
}
