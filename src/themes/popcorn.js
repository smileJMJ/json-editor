import { AbstractTheme } from '../theme.js'
import rules from './popcorn.css.js'

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
    input.errmsg.innerHTML = ''
    input.errmsg.appendChild(document.createTextNode(text))
  }

  removeInputError (input) {
    const group = this.closest(input, '.form-control')
    if (input.style) {
      input.style.borderColor = ''
    }
    if (input.errmsg) input.errmsg.style.display = 'none'
    group.classList.remove('error')
  }
}

/* Custom stylesheet rules. format: "selector" : "CSS rules" */
popcornTheme.rules = rules
