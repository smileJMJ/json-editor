/* eslint-disable */
import { AbstractEditor } from '../editor.js'
import { extend } from '../utilities.js'
import uploadMsg from '../popcorn/msg/upload'

export class UploadEditor extends AbstractEditor {
  getNumColumns () {
    return 4
  }

  build () {
    if (!this.options.compact) this.header = this.label = this.theme.getFormInputLabel(this.getTitle(), this.isRequired())
    if (this.schema.description) this.description = this.theme.getFormInputDescription(this.translateProperty(this.schema.description))
    if (this.options.infoText) this.infoButton = this.theme.getInfoButton(this.translateProperty(this.options.infoText))

    this.valueType = this.schema.type || 'string' // type: string / array
    this.value = this.valueType === 'array' ? [] : null // img url 담을 array
    this.country = this.options.country || 'ko'
    this.msg = uploadMsg[this.country]
    this.innerContents = this.options.innerContents || `
    <h3>첨부파일 관리</h3>
    <ul>
        <li>파일 포맷: 이미지 파일 (JPEG, PNG, BMP...)</li>
        <li>파일 크기: 20MB 이하 / 첨부 파일 갯수: 1개</li>
    </ul>
  ` // 내부 설명 콘텐츠

    /* Editor options */
    this.options = this.expandCallbacks('upload', extend({}, {
      title: 'Browse',
      icon: '',
      auto_upload: true, /* Trigger file upload button automatically */
      //auto_upload: false,
      hide_input: false, /* Hide the Browse button and name display (Only works if 'enable_drag_drop' is true) */
      enable_drag_drop: false, /* Enable Drag&Drop uploading */
      drop_zone_text: 'Drag & Drop file here', /* Text displayed in dropzone box */
      drop_zone_top: false, /* Position of dropzone. true=before button input, false=after button input */
      alt_drop_zone: '', /* Alternate DropZone DOM selector (Can be created inside another property) */
      mime_type: '', /* If set, restricts to mime type(s). Can be either a string or an array */
      max_upload_size: 0, /* Maximum file size allowed. 0 = no limit */
      upload_handler: (jseditor, type, file, cbs) => {
        /* Default dummy test upload handler */
        window.alert(`No upload_handler defined for "${jseditor.path}". You must create your own handler to enable upload to server`)
      }
    }, this.defaults.options.upload || {}, this.options.upload || {}))

    this.options.mime_type = this.options.mime_type ? [].concat(this.options.mime_type) : []

    // drop mode 여부 - enable_drag_drop: true인지 여부
    this.isDropMode = this.options.enable_drag_drop || false

    /* Input that holds the base64 string */
    this.input = this.theme.getFormInputField('hidden')
    this.container.appendChild(this.input)

    /* Don't show uploader if this is readonly */
    if (!this.schema.readOnly && !this.schema.readonly) {
      if (typeof this.options.upload_handler !== 'function') throw new Error('Upload handler required for upload editor')

      /* File uploader */
      this.uploader = this.theme.getFormInputField('file')
      this.uploader.style.display = 'none'
      if (this.options.mime_type.length) this.uploader.setAttribute('accept', this.options.mime_type)

      if (!(this.options.enable_drag_drop === true && this.options.hide_input === true)) {
        /* Pass click to this.uploader element */
        this.clickHandler = (e) => {
          this.uploader.dispatchEvent(new window.MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: false
          }))
        }

        /* Browse button */
        this.browseButton = this.getButton(this.msg.upload_btn_browse, 'browse', this.msg.upload_btn_browse)
        this.browseButton.addEventListener('click', this.clickHandler)

        /* Display field */
        this.fileDisplay = this.theme.getFormInputField('input')
        this.fileDisplay.setAttribute('readonly', true)
        this.fileDisplay.value = 'No file selected.'
        this.fileDisplay.addEventListener('dblclick', this.clickHandler)

        this.fileUploadGroup = this.theme.getInputGroup(this.fileDisplay, [this.browseButton])
        if (!this.fileUploadGroup) {
          /* Themes that doesn't support input grouping */
          this.fileUploadGroup = document.createElement('div')
          this.fileUploadGroup.appendChild(this.fileDisplay)
          this.fileUploadGroup.appendChild(this.browseButton)
        }
      }

      /* Drag&Drop upload enabled */
      if (this.options.enable_drag_drop === true) {
        /* Alternate DropZone defined */
        if (this.options.alt_drop_zone !== '') {
          this.altDropZone = document.querySelector(this.options.alt_drop_zone)
          if (this.altDropZone) this.dropZone = this.altDropZone
          else throw new Error(`Error: alt_drop_zone selector "${this.options.alt_drop_zone}" not found!`)
        } else this.dropZone = this.theme.getDropZone(this.options.drop_zone_text)

        if (this.dropZone) {
          this.dropZone.classList.add('upload-dropzone')
          this.dropZone.addEventListener('dblclick', this.clickHandler)
        }
      }

      /* Triggered after file have been selected */
      this.uploadHandler = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const files = e.target.files || e.dataTransfer.files
        if (files && files.length) {
          if (this.options.max_upload_size !== 0 && files[0].size > this.options.max_upload_size) {
            this.theme.addInputError(this.uploader, `Filesize too large. Max size is ${this.options.max_upload_size}`)
          } else if (this.options.mime_type.length !== 0 && !this.isValidMimeType(files[0].type, this.options.mime_type)) {
            this.theme.addInputError(this.uploader, `Wrong file format. Allowed format(s): ${this.options.mime_type.toString()}`)
          } else {
            if (this.fileDisplay) this.fileDisplay.value = files[0].name
            let fr = new window.FileReader()
            fr.onload = (evt) => {
              this.preview_value = evt.target.result
              this.refreshPreview(files)
              this.onChange(true)
              fr = null
            }
            fr.readAsDataURL(files[0])
          }
        }
      }

      this.uploader.addEventListener('change', this.uploadHandler)

      /* Drag&Drop Event Handler */
      this.dragHandler = e => {
        const files = e.dataTransfer.items || e.dataTransfer.files
        const validType = files && files.length && (this.options.mime_type.length === 0 || this.isValidMimeType(files[0].type, this.options.mime_type))
        const validZone = e.currentTarget.classList && e.currentTarget.classList.contains('upload-dropzone') && validType
        switch ((e.currentTarget === window ? 'w_' : 'e_') + e.type) {
          case 'w_drop':
          case 'w_dragover':
            /* prevent default browser action if dropped outside dropzone */
            if (!validZone) e.dataTransfer.dropEffect = 'none'
            break
          case 'e_dragenter': {
            if (validZone) {
              this.dropZone.classList.add('valid-dropzone')
              e.dataTransfer.dropEffect = 'copy'
            } else this.dropZone.classList.add('invalid-dropzone')
            break
          }
          case 'e_dragover': {
            if (validZone) e.dataTransfer.dropEffect = 'copy'
            break
          }
          case 'e_dragleave':
            this.dropZone.classList.remove('valid-dropzone', 'invalid-dropzone')
            break
          case 'e_drop': {
            this.dropZone.classList.remove('valid-dropzone', 'invalid-dropzone')
            if (validZone) this.uploadHandler(e)
            break
          }
        }
        if (!validZone) e.preventDefault()
      }

      /* Set Drag'n'Drop handlers */
      if (this.options.enable_drag_drop === true) {
        ['dragover', 'drop'].forEach((ev) => {
          window.addEventListener(ev, this.dragHandler, true)
        });
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((ev) => {
          this.dropZone.addEventListener(ev, this.dragHandler, true)
        })
      }
    }

    // 기존 업로드 영역 생성
    // this.preview = document.createElement('div')

    // this.control = this.input.controlgroup = this.theme.getFormControl(this.label, this.uploader || this.input, this.description, this.infoButton, null, this.options)
    // if (this.uploader) this.uploader.controlgroup = this.control
    // const inputNode = this.uploader || this.input
    // const elements = document.createElement('div')

    // if (this.dropZone && !this.altDropZone && this.options.drop_zone_top === true) elements.appendChild(this.dropZone)
    // if (this.fileUploadGroup) elements.appendChild(this.fileUploadGroup)
    // if (this.dropZone && !this.altDropZone && this.options.drop_zone_top !== true) elements.appendChild(this.dropZone)
    // elements.appendChild(this.preview)
    // inputNode.parentNode.insertBefore(elements, inputNode.nextSibling)

    // this.container.appendChild(this.control)
    /////////

    if (this.isDropMode) {
      this.setDropMode()
    } else {
      this.setBasicMode()
    }

    /* Any special formatting that needs to happen after the input is added to the dom */
    window.requestAnimationFrame(() => {
      this.afterInputReady()
    })
  }

  // 기본 모드 생성
  setBasicMode () {
    const gridWrap = document.createElement('div')
    const inputWrap = document.createElement('div')
    const inputNode = this.uploader || this.input
    const innerContents = this.setInnerContents(gridWrap) // innserContents 생성
    gridWrap.classList.add('grid', 'grid-cols-12')
    inputWrap.classList.add('input-wrap','col-span-6')
    innerContents.classList.add('col-span-6')
    inputWrap.append(inputNode, this.browseButton)
    this.setPreviewList(inputWrap)
    gridWrap.appendChild(inputWrap) 

    this.control = this.input.controlgroup = this.theme.getFormControl(this.label, null, null, null, null, this.options)
    this.control.classList.add('image-upload', 'basic')
    this.control.appendChild(gridWrap)

    this.container.appendChild(this.control)
  }

  // drop mode 생성
  setDropMode () {

  }

  // innerContents 생성
  setInnerContents (target) {
    if(!target || !this.innerContents) return
    const innerContents = document.createElement('div')
    innerContents.classList.add('inner-contents')
    innerContents.innerHTML = this.innerContents
    target.appendChild(innerContents)

    return innerContents
  }

  // previewList 영역 생성
  setPreviewList (target) {
    if(!target) return
    const preview = document.createElement('div')
    const previewList = document.createElement('ul') // preview ul 생성

    
    preview.classList.add('preview-wrap', 'je-upload-preview')
    previewList.classList.add('preview-list')
    preview.appendChild(previewList)
    target.appendChild(preview)
    
    this.preview = preview
    this.previewList = previewList
  }

  // preview list item 생성
  setPreviewListItem (item, file, data, isDropMode) {
    if (!item) return
    const info = document.createElement('div')
    const status = document.createElement('div')
    const inputHidden = document.createElement('input')

    inputHidden.type = 'hidden'
    item.appendChild(inputHidden)

    if (isDropMode && file.mimeType.substr(0, 5) === 'image') {
      const img = document.createElement('img')
      img.src = data
      info.appendChild(img)
    }
    info.classList.add('info')
    info.innerHTML += `<strong>${file.name}</strong><span>${file.formattedSize}</span>`
    item.appendChild(info)

    status.classList.add('status')
    item.appendChild(status)

    return item
  }

  // preview upload button
  setPreviewUploadButton (item, file) {
    //const uploadButton = this.getButton('button_upload', 'upload', 'button_upload')
    const uploadButton = this.getButton(this.msg.upload_btn_upload, 'upload', this.msg.upload_btn_upload)
    uploadButton.addEventListener('click', (event) => {
      event.preventDefault()

      uploadButton.setAttribute('disabled', 'disabled')
      this.theme.removeInputError(this.uploader)

      // if (this.theme.getProgressBar) {
      //   this.progressBar = this.theme.getProgressBar()
      //   this.preview.appendChild(this.progressBar)
      // }

      this.options.upload_handler(this.path, file, {
        success: (url) => {
          const hidden = item.querySelector('input[type="hidden"]')

          this.optimizeValue(url)
          if(hidden) {
            hidden.value = url
          }

          // if (this.parent) this.parent.onChildEditorChange(this)
          // else this.jsoneditor.onChange()

          //if (this.progressBar) this.preview.removeChild(this.progressBar)
          uploadButton.removeAttribute('disabled')
        },
        failure: (error) => {
          this.theme.addInputError(this.uploader, error)
          //if (this.progressBar) this.preview.removeChild(this.progressBar)
          uploadButton.removeAttribute('disabled')
        },
        updateProgress: (progress) => {
          // if (this.progressBar) {
          //   if (progress) this.theme.updateProgressBar(this.progressBar, progress)
          //   else this.theme.updateProgressBarUnknown(this.progressBar)
          // }
        }
      })
    })

    item.querySelector('.status').appendChild(uploadButton)

    if (this.options.auto_upload) {
      uploadButton.dispatchEvent(new window.MouseEvent('click'))
      uploadButton.parentNode.removeChild(uploadButton)
    }
  }

  // preview remove button
  setPreviewRemoveButton (item, data) {
    const removeButton = document.createElement('button')

    removeButton.addEventListener('click', e => {
      const removeUrl = item.querySelector('input[type="hidden"]').value
      item.remove();
      this.removeValue(removeUrl)
    })

    item.querySelector('.status').appendChild(removeButton)
  }

  afterInputReady () {
    if (this.value && this.isDropMode) {
      const img = document.createElement('img')
      img.style.maxWidth = '100%'
      img.style.maxHeight = '100px'
      img.onload = (event) => {
        this.preview.appendChild(img)
      }
      img.onerror = error => {
        // eslint-disable-next-line no-console
        console.error('upload error', error, error.currentTarget)
      }
      img.src = this.container.querySelector('a').href
    }
    this.theme.afterInputReady(this.input)
  }

  // refreshPreview (files) {
  //   if (this.last_preview === this.preview_value) return
  //   this.last_preview = this.preview_value

  //   this.preview.innerHTML = ''

  //   if (!this.preview_value) return

  //   const file = files[0]

  //   /* mime type extracted from file data. More exact than the one in the file object */
  //   const mime = this.preview_value.match(/^data:([^;,]+)[;,]/)
  //   file.mimeType = mime ? mime[1] : 'unknown'

  //   if (file.size > 0) {
  //     /* Format bytes as KB/MB etc. with 2 decimals */
  //     const i = Math.floor(Math.log(file.size) / Math.log(1024))
  //     file.formattedSize = `${parseFloat((file.size / (1024 ** i)).toFixed(2))} ${['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'][i]}`
  //   } else file.formattedSize = '0 Bytes'

  //   //const uploadButton = this.getButton('button_upload', 'upload', 'button_upload')
  //   const uploadButton = this.getButton(this.msg.upload_btn_upload, 'upload', this.msg.upload_btn_upload)
  //   uploadButton.addEventListener('click', (event) => {
  //     event.preventDefault()

  //     uploadButton.setAttribute('disabled', 'disabled')
  //     this.theme.removeInputError(this.uploader)

  //     if (this.theme.getProgressBar) {
  //       this.progressBar = this.theme.getProgressBar()
  //       this.preview.appendChild(this.progressBar)
  //     }

  //     this.options.upload_handler(this.path, file, {
  //       success: (url) => {
  //         this.setValue(url)

  //         if (this.parent) this.parent.onChildEditorChange(this)
  //         else this.jsoneditor.onChange()

  //         if (this.progressBar) this.preview.removeChild(this.progressBar)
  //         uploadButton.removeAttribute('disabled')
  //       },
  //       failure: (error) => {
  //         this.theme.addInputError(this.uploader, error)
  //         if (this.progressBar) this.preview.removeChild(this.progressBar)
  //         uploadButton.removeAttribute('disabled')
  //       },
  //       updateProgress: (progress) => {
  //         if (this.progressBar) {
  //           if (progress) this.theme.updateProgressBar(this.progressBar, progress)
  //           else this.theme.updateProgressBarUnknown(this.progressBar)
  //         }
  //       }
  //     })
  //   })

  //   this.preview.appendChild(this.theme.getUploadPreview(file, uploadButton, this.preview_value, this.isDropMode))

  //   if (this.options.auto_upload) {
  //     uploadButton.dispatchEvent(new window.MouseEvent('click'))
  //     uploadButton.parentNode.removeChild(uploadButton)
  //   }
  // }

  refreshPreview (files) {
    if (this.last_preview === this.preview_value) return
    this.last_preview = this.preview_value

    if (!this.preview_value) return

    const file = files[0]
    let item = this.previewList.querySelector('li')

    if(this.valueType === 'array' || (this.valueType === 'string' && !item)) {
      item = document.createElement('li')
      item.classList.add('flex')
    } else {
      item = this.previewList.querySelector('li')
      item.innerHTML = ''
    }

    /* mime type extracted from file data. More exact than the one in the file object */
    const mime = this.preview_value.match(/^data:([^;,]+)[;,]/)
    file.mimeType = mime ? mime[1] : 'unknown'

    if (file.size > 0) {
      /* Format bytes as KB/MB etc. with 2 decimals */
      const i = Math.floor(Math.log(file.size) / Math.log(1024))
      file.formattedSize = `${parseFloat((file.size / (1024 ** i)).toFixed(2))} ${['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'][i]}`
    } else file.formattedSize = '0 Bytes'

    //this.preview.appendChild(this.theme.getUploadPreview(file, uploadButton, this.preview_value, this.isDropMode))
    this.setPreviewListItem (item, file, this.preview_value, this.isDropMode)
    this.setPreviewUploadButton(item, file) // upload button 및 이벤트 생성
    this.setPreviewRemoveButton(item, file) // remove button 및 이벤트 생성
    this.previewList.appendChild(item)
  }

  enable () {
    if (!this.always_disabled) {
      if (this.uploader) this.uploader.disabled = false
      super.enable()
    }
  }

  disable (alwaysDisabled) {
    if (alwaysDisabled) this.always_disabled = true
    if (this.uploader) this.uploader.disabled = true
    super.disable()
  }

  optimizeValue (url) {
    let result
    if(!url || typeof url !== 'string') return
    if (this.valueType === 'array') {
      result = [...this.value, url]
    } else { // string
      result = url
    }
    this.setValue(result)
  }

  removeValue (url) {
    let result
    if(!url || typeof url !== 'string') return
    if(this.valueType === 'array') {
      // TODO this.value에서 url index 추출해서 slice로 제거하기
      let idx
      result = [...this.value]
      if(result.length > 1) {
        result.some((v, i) => {
          if (v === url) {
            idx = i
            return true
          }
        })
        result.splice(idx, 1)
      } else {
        result = []
      }
    } else {
      result = null
    }
    this.setValue(result)
  }

  setValue (val) {
    this.value = val
    console.log('setValue', val)
    this.onChange()
  }

  destroy () {
    /* Remove Drag'n'Drop handlers */
    if (this.options.enable_drag_drop === true) {
      ['dragover', 'drop'].forEach((ev) => {
        window.removeEventListener(ev, this.dragHandler, true)
      });
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((ev) => {
        this.dropZone.removeEventListener(ev, this.dragHandler, true)
      })
      this.dropZone.removeEventListener('dblclick', this.clickHandler)
      if (this.dropZone && this.dropZone.parentNode) this.dropZone.parentNode.removeChild(this.dropZone)
    }

    if (this.uploader && this.uploader.parentNode) {
      this.uploader.removeEventListener('change', this.uploadHandler)
      this.uploader.parentNode.removeChild(this.uploader)
    }
    if (this.browseButton && this.browseButton.parentNode) {
      this.browseButton.removeEventListener('click', this.clickHandler)
      this.browseButton.parentNode.removeChild(this.browseButton)
    }
    if (this.fileDisplay && this.fileDisplay.parentNode) {
      this.fileDisplay.removeEventListener('dblclick', this.clickHandler)
      this.fileDisplay.parentNode.removeChild(this.fileDisplay)
    }
    if (this.fileUploadGroup && this.fileUploadGroup.parentNode) this.fileUploadGroup.parentNode.removeChild(this.fileUploadGroup)
    if (this.preview && this.preview.parentNode) this.preview.parentNode.removeChild(this.preview)
    if (this.header && this.header.parentNode) this.header.parentNode.removeChild(this.header)
    if (this.input && this.input.parentNode) this.input.parentNode.removeChild(this.input)

    super.destroy()
  }

  isValidMimeType (mimeType, mimeTypesList) {
    return mimeTypesList.reduce((a, v) => a || new RegExp(v.replace(/\*/g, '.*'), 'gi').test(mimeType), false)
  }
}
/* eslint-disable */