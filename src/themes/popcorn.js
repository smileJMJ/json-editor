import { AbstractTheme } from '../theme.js'
import { LABEL_POSITION } from '../enums'
import './popcorn-icon'

export class popcornTheme extends AbstractTheme {
  /*
    Form
  */
  getFormControl (label, input, description, infoText, formName, options) {
    const { labelPosition = LABEL_POSITION.TOP, inputSiblingLabel = false } = options || {}
    const el = document.createElement('div')
    let labelWrap = null
    const isLabelPositionLeft = labelPosition === LABEL_POSITION.LEFT
    el.classList.add('form-control')

    if (label) {
      if (isLabelPositionLeft) {
        labelWrap = document.createElement('div')
        labelWrap.classList.add('flex')
        labelWrap.appendChild(label)
        el.appendChild(labelWrap)
      } else {
        el.appendChild(label)
      }
      if (formName) label.setAttribute('for', formName)
    }

    if (!!input && (input.type === 'checkbox' || input.type === 'radio') && label && !inputSiblingLabel) {
      input.style.width = 'auto'
      label.insertBefore(input, label.firstChild)
      if (infoText) label.appendChild(infoText)
    } else {
      const wrap = isLabelPositionLeft ? labelWrap : el
      if (infoText && label) label.appendChild(infoText)
      !!input && wrap.appendChild(input)
    }

    if (description) el.appendChild(description)
    return el
  }

  /*
    Radio
  */
  getFormRadioControl (label, input, compact, themeName) {
    const el = document.createElement('div')
    el.appendChild(label)
    input.style.width = 'auto'
    label.insertBefore(input, label.firstChild)
    input.insertAdjacentHTML('afterend', '<span class="custom-radio"></span>')
    if (compact) {
      el.classList.add('je-radio-control--compact')
    }

    return el
  }

  /*
    Checkbox
  */
  getCheckboxSwitch () {
    const el = document.createElement('span')
    el.classList.add('custom-switch')
    return el
  }

  /*
    ErrorMsg
  */
  addInputError (input, text, target) {
    const group = target || this.closest(input, '.form-control')
    const errorIcon = `<svg class="w-4 h-4 inline-block mr-1.5 shrink-0"><use href="#popcorn-error"/></svg>`;
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
      input.errmsg.innerHTML = `<p class="flex items-center">${errorIcon}${text[0]}</p>`
    } else {
      input.errmsg.innerHTML = `<p class="flex items-center">${errorIcon}${text}</p>`
    }
  }

  removeInputError (input, target) {
    const group = target || this.closest(input, '.form-control')
    if (input.style) {
      input.style.borderColor = ''
    }
    if (input.errmsg) input.errmsg.style.display = 'none'
    group && group.classList.remove('error')
  }

  /*
    Grid
  */
  setGridColumnSize (el, size) {
    !!size && el.classList.add(`col-span-${size}`)
  }

  /*
    Upload
  */
  // addPreviewListItem (target, file, data, isDropMode) {
  //   if (!target) return
  //   const item = document.createElement('li')
  //   item.classList.add('flex')

  //   if (isDropMode && file.mimeType.substr(0, 5) === 'image') {
  //     const img = document.createElement('img')
  //     img.src = data
  //     item.appendChild(img)
  //   }
  //   const info = document.createElement('div')
  //   info.innerHTML += `<strong>${file.name}</strong><span>${file.formattedSize}</span>`
  //   item.appendChild(info)

  //   target.appendChild(item)
  //   // preview.appendChild(uploadButton)

  //   // TODO value(url) 변경 - type: string -> 값 교체, type: array -> push 진행
  // }

  setPreviewListItem (item, file, data, isDropMode, uploadButton, closeButton) {
    if (!item) return
    const info = document.createElement('div')
    const status = document.createElement('div')

    if (isDropMode && file.mimeType.substr(0, 5) === 'image') {
      const img = document.createElement('img')
      img.src = data
      info.appendChild(img)
    }
    info.classList.add('info')
    info.innerHTML += `<strong>${file.name}</strong><span>${file.formattedSize}</span>`
    item.appendChild(info)

    status.classList.add('status')
    status.appendChild(uploadButton)
    item.appendChild(status)

    return item
  }

  getUploadPreview (target, file, uploadButton, data, isDropMode) {

  }

  /* file is an object with properties: name, type, mimeType, size amd formattedSize */
  // getUploadPreview (file, uploadButton, data, isDropMode) {
  //   const preview = document.createElement('div')
  //   const previewList = document.createElement('ul')
  //   preview.classList.add('je-upload-preview')
  //   preview.appendChild(previewList)

  //   if (isDropMode && file.mimeType.substr(0, 5) === 'image') {
  //     const img = document.createElement('img')
  //     img.src = data
  //     preview.appendChild(img)
  //   }
  //   const info = document.createElement('div')

  //   info.innerHTML += `<strong>Name:</strong> ${file.name}<br><strong>Type:</strong> ${file.type}<br><strong>Size:</strong> ${file.formattedSize}`
  //   preview.appendChild(info)

  //   preview.appendChild(uploadButton)

  //   const clear = document.createElement('div')
  //   clear.style.clear = 'left'
  //   preview.appendChild(clear)

  //   return preview
  // }
}
