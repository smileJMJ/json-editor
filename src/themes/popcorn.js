import { AbstractTheme } from '../theme.js'

export class popcornTheme extends AbstractTheme {
  addInputError (input, text) {
    const group = this.closest(input, '.form-control')
    if (!input.errmsg) {
      const description = group && group.querySelector('p')
      input.errmsg = document.createElement('div')
      input.errmsg.setAttribute('class', 'errmsg')
      if (description) { // description보다 errmsg를 위에 생성하기 위해
        description.insertAdjacentElement('beforebegin', input.errmsg)
      } else {
        group.appendChild(input.errmsg)
      }
    } else {
      input.errmsg.style.display = 'block'
    }

    group.classList.add('error')
    if (Array.isArray(text) && text.length > 0) {
      input.errmsg.innerHTML = `<p>${text[0]}</p>`
    } else {
      input.errmsg.innerHTML = `<p>${text}</p>`
    }
  }

  removeInputError (input) {
    const group = this.closest(input, '.form-control')
    if (input.style) {
      input.style.borderColor = ''
    }
    if (input.errmsg) input.errmsg.style.display = 'none'
    group.classList.remove('error')
  }

  setGridColumnSize (el, size) {
    el.classList.add(`col-span-${size}`)
  }
}
