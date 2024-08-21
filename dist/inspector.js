/*
Trix 2.1.5
Copyright © 2024 37signals, LLC
 */
/* eslint-disable
    id-length,
*/
const arraysAreEqual = function(a = [], b = []) {
  if (a.length !== b.length) {
    return false
  }
  for (let index = 0; index < a.length; index++) {
    const value = a[index];
    if (value !== b[index]) {
      return false
    }
  }
  return true
};

const arrayStartsWith = (a = [], b = []) => arraysAreEqual(a.slice(0, b.length), b);

const spliceArray = function(array, ...args) {
  const result = array.slice(0);
  result.splice(...args);
  return result
};

const summarizeArrayChange = function(oldArray = [], newArray = []) {
  const added = [];
  const removed = [];

  const existingValues = new Set();

  oldArray.forEach((value) => {
    existingValues.add(value);
  });

  const currentValues = new Set();

  newArray.forEach((value) => {
    currentValues.add(value);
    if (!existingValues.has(value)) {
      added.push(value);
    }
  });

  oldArray.forEach((value) => {
    if (!currentValues.has(value)) {
      removed.push(value);
    }
  });

  return { added, removed }
};

const attributes = {
  default: {
    tagName: "div",
    parse: false,
  },
  quote: {
    tagName: "blockquote",
    nestable: true,
  },
  heading1: {
    tagName: "h1",
    terminal: true,
    breakOnReturn: true,
    group: false,
  },
  code: {
    tagName: "pre",
    terminal: true,
    htmlAttributes: [ "language" ],
    text: {
      plaintext: true,
    },
  },
  bulletList: {
    tagName: "ul",
    parse: false,
  },
  bullet: {
    tagName: "li",
    listAttribute: "bulletList",
    group: false,
    nestable: true,
    test(element) {
      return tagName$1(element.parentNode) === attributes[this.listAttribute].tagName
    },
  },
  numberList: {
    tagName: "ol",
    parse: false,
  },
  number: {
    tagName: "li",
    listAttribute: "numberList",
    group: false,
    nestable: true,
    test(element) {
      return tagName$1(element.parentNode) === attributes[this.listAttribute].tagName
    },
  },
  attachmentGallery: {
    tagName: "div",
    exclusive: true,
    terminal: true,
    parse: false,
    group: false,
  },
};

const tagName$1 = (element) => element?.tagName?.toLowerCase();

const ZERO_WIDTH_SPACE = "\uFEFF";
const NON_BREAKING_SPACE = "\u00A0";
const OBJECT_REPLACEMENT_CHARACTER = "\uFFFC";

const extend = function(properties) {
  for (const key in properties) {
    const value = properties[key];
    this[key] = value;
  }
  return this
};

const attachmentSelector = "[data-trix-attachment]";

const attachments = {
  preview: {
    presentation: "gallery",
    caption: {
      name: true,
      size: true,
    },
  },
  file: {
    caption: {
      size: true,
    },
  },
};

const html = document.documentElement;
const match = html.matches;

const handleEvent = function(eventName, { onElement, matchingSelector, withCallback, inPhase, preventDefault, times } = {}) {
  const element = onElement ? onElement : html;
  const selector = matchingSelector;
  const useCapture = inPhase === "capturing";

  const handler = function(event) {
    if (times != null && --times === 0) {
      handler.destroy();
    }
    const target = findClosestElementFromNode(event.target, { matchingSelector: selector });
    if (target != null) {
      withCallback?.call(target, event, target);
      if (preventDefault) {
        event.preventDefault();
      }
    }
  };

  handler.destroy = () => element.removeEventListener(eventName, handler, useCapture);

  element.addEventListener(eventName, handler, useCapture);
  return handler
};

const handleEventOnce = function(eventName, options = {}) {
  options.times = 1;
  return handleEvent(eventName, options)
};

const triggerEvent = function(eventName, { onElement, bubbles, cancelable, attributes } = {}) {
  const element = onElement != null ? onElement : html;
  bubbles = bubbles !== false;
  cancelable = cancelable !== false;

  const event = document.createEvent("Events");
  event.initEvent(eventName, bubbles, cancelable);
  if (attributes != null) {
    extend.call(event, attributes);
  }
  return element.dispatchEvent(event)
};

const elementMatchesSelector = function(element, selector) {
  if (element?.nodeType === 1) {
    return match.call(element, selector)
  }
};

const findClosestElementFromNode = function(node, { matchingSelector, untilNode } = {}) {
  while (node && node.nodeType !== Node.ELEMENT_NODE) {
    node = node.parentNode;
  }
  if (node == null) {
    return
  }

  if (matchingSelector != null) {
    if (node.closest && untilNode == null) {
      return node.closest(matchingSelector)
    } else {
      while (node && node !== untilNode) {
        if (elementMatchesSelector(node, matchingSelector)) {
          return node
        }
        node = node.parentNode;
      }
    }
  } else {
    return node
  }
};

const findInnerElement = function(element) {
  while (element?.firstElementChild) {
    element = element.firstElementChild;
  }
  return element
};

const innerElementIsActive = (element) =>
  document.activeElement !== element && elementContainsNode(element, document.activeElement);

const elementContainsNode = function(element, node) {
  if (!element || !node) {
    return
  }
  while (node) {
    if (node === element) {
      return true
    }
    node = node.parentNode;
  }
};

const findNodeFromContainerAndOffset = function(container, offset) {
  if (!container) {
    return
  }
  if (container.nodeType === Node.TEXT_NODE) {
    return container
  } else if (offset === 0) {
    return container.firstChild != null ? container.firstChild : container
  } else {
    return container.childNodes.item(offset - 1)
  }
};

const findElementFromContainerAndOffset = function(container, offset) {
  const node = findNodeFromContainerAndOffset(container, offset);
  return findClosestElementFromNode(node)
};

const findChildIndexOfNode = function(node) {
  if (!node?.parentNode) {
    return
  }
  let childIndex = 0;
  node = node.previousSibling;
  while (node) {
    childIndex++;
    node = node.previousSibling;
  }
  return childIndex
};

const removeNode = (node) => node?.parentNode?.removeChild(node);

const walkTree = function(tree, { onlyNodesOfType, usingFilter, expandEntityReferences } = {}) {
  const whatToShow = (() => {
    switch (onlyNodesOfType) {
      case "element":
        return NodeFilter.SHOW_ELEMENT
      case "text":
        return NodeFilter.SHOW_TEXT
      case "comment":
        return NodeFilter.SHOW_COMMENT
      default:
        return NodeFilter.SHOW_ALL
    }
  })();

  return document.createTreeWalker(
    tree,
    whatToShow,
    usingFilter != null ? usingFilter : null,
    expandEntityReferences === true
  )
};

const tagName = (element) => element?.tagName?.toLowerCase();

const makeElement = function(tag, options = {}) {
  let key, value;
  if (typeof tag === "object") {
    options = tag;
    tag = options.tagName;
  } else {
    options = { attributes: options };
  }

  const element = document.createElement(tag);

  if (options.editable != null) {
    if (options.attributes == null) {
      options.attributes = {};
    }
    options.attributes.contenteditable = options.editable;
  }

  if (options.attributes) {
    for (key in options.attributes) {
      value = options.attributes[key];
      element.setAttribute(key, value);
    }
  }

  if (options.style) {
    for (key in options.style) {
      value = options.style[key];
      element.style[key] = value;
    }
  }

  if (options.data) {
    for (key in options.data) {
      value = options.data[key];
      element.dataset[key] = value;
    }
  }

  if (options.className) {
    options.className.split(" ").forEach((className) => {
      element.classList.add(className);
    });
  }

  if (options.textContent) {
    element.textContent = options.textContent;
  }

  if (options.childNodes) {
    [].concat(options.childNodes).forEach((childNode) => {
      element.appendChild(childNode);
    });
  }

  return element
};

let blockTagNames = undefined;

const getBlockTagNames = function() {
  if (blockTagNames != null) {
    return blockTagNames
  }

  blockTagNames = [];
  for (const key in attributes) {
    const attributes$1 = attributes[key];
    if (attributes$1.tagName) {
      blockTagNames.push(attributes$1.tagName);
    }
  }

  return blockTagNames
};

const nodeIsBlockContainer = (node) => nodeIsBlockStartComment(node?.firstChild);

const nodeProbablyIsBlockContainer = function(node) {
  return getBlockTagNames().includes(tagName(node)) && !getBlockTagNames().includes(tagName(node.firstChild))
};

const nodeIsBlockStart = function(node, { strict } = { strict: true }) {
  if (strict) {
    return nodeIsBlockStartComment(node)
  } else {
    return (
      nodeIsBlockStartComment(node) || !nodeIsBlockStartComment(node.firstChild) && nodeProbablyIsBlockContainer(node)
    )
  }
};

const nodeIsBlockStartComment = (node) => nodeIsCommentNode(node) && node?.data === "block";

const nodeIsCommentNode = (node) => node?.nodeType === Node.COMMENT_NODE;

const nodeIsCursorTarget = function(node, { name } = {}) {
  if (!node) {
    return
  }
  if (nodeIsTextNode(node)) {
    if (node.data === ZERO_WIDTH_SPACE) {
      if (name) {
        return node.parentNode.dataset.trixCursorTarget === name
      } else {
        return true
      }
    }
  } else {
    return nodeIsCursorTarget(node.firstChild)
  }
};

const nodeIsAttachmentElement = (node) => elementMatchesSelector(node, attachmentSelector);

const nodeIsEmptyTextNode = (node) => nodeIsTextNode(node) && node?.data === "";

const nodeIsTextNode = (node) => node?.nodeType === Node.TEXT_NODE;

// https://github.com/mathiasbynens/unicode-2.1.8/blob/master/Bidi_Class/Right_To_Left/regex.js
const RTL_PATTERN =
  /[\u05BE\u05C0\u05C3\u05D0-\u05EA\u05F0-\u05F4\u061B\u061F\u0621-\u063A\u0640-\u064A\u066D\u0671-\u06B7\u06BA-\u06BE\u06C0-\u06CE\u06D0-\u06D5\u06E5\u06E6\u200F\u202B\u202E\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE72\uFE74\uFE76-\uFEFC]/;

const getDirection = (function() {
  const input = makeElement("input", { dir: "auto", name: "x", dirName: "x.dir" });
  const textArea = makeElement("textarea", { dir: "auto", name: "y", dirName: "y.dir" });
  const form = makeElement("form");
  form.appendChild(input);
  form.appendChild(textArea);

  const supportsDirName = (function() {
    try {
      return new FormData(form).has(textArea.dirName)
    } catch (error) {
      return false
    }
  })();

  const supportsDirSelector = (function() {
    try {
      return input.matches(":dir(ltr),:dir(rtl)")
    } catch (error) {
      return false
    }
  })();

  if (supportsDirName) {
    return function(string) {
      textArea.value = string;
      return new FormData(form).get(textArea.dirName)
    }
  } else if (supportsDirSelector) {
    return function(string) {
      input.value = string;
      if (input.matches(":dir(rtl)")) {
        return "rtl"
      } else {
        return "ltr"
      }
    }
  } else {
    return function(string) {
      const char = string.trim().charAt(0);
      if (RTL_PATTERN.test(char)) {
        return "rtl"
      } else {
        return "ltr"
      }
    }
  }
})();

const androidVersionMatch = navigator.userAgent.match(/android\s([0-9]+.*Chrome)/i);
const androidVersion = androidVersionMatch && parseInt(androidVersionMatch[1]);

var browser = {
  // Android emits composition events when moving the cursor through existing text
  // Introduced in Chrome 65: https://bugs.chromium.org/p/chromium/issues/detail?id=764439#c9
  composesExistingText: /Android.*Chrome/.test(navigator.userAgent),

  // Android 13, especially on Samsung keyboards, emits extra compositionend and beforeinput events
  // that can make the input handler lose the current selection or enter an infinite input -> render -> input
  // loop.
  recentAndroid: androidVersion && androidVersion > 12,
  samsungAndroid: androidVersion && navigator.userAgent.match(/Android.*SM-/),

  // IE 11 activates resizing handles on editable elements that have "layout"
  forcesObjectResizing: /Trident.*rv:11/.test(navigator.userAgent),
  // https://www.w3.org/TR/input-events-1/ + https://www.w3.org/TR/input-events-2/
  supportsInputEvents: typeof InputEvent !== "undefined" &&
    [ "data", "getTargetRanges", "inputType" ].every(prop => prop in InputEvent.prototype),
};

var css = {
  attachment: "attachment",
  attachmentCaption: "attachment__caption",
  attachmentCaptionEditor: "attachment__caption-editor",
  attachmentMetadata: "attachment__metadata",
  attachmentMetadataContainer: "attachment__metadata-container",
  attachmentName: "attachment__name",
  attachmentProgress: "attachment__progress",
  attachmentSize: "attachment__size",
  attachmentToolbar: "attachment__toolbar",
  attachmentGallery: "attachment-gallery",
};

var lang = {
  attachFiles: "Attach Files",
  bold: "Bold",
  bullets: "Bullets",
  byte: "Byte",
  bytes: "Bytes",
  captionPlaceholder: "Add a caption…",
  code: "Code",
  heading1: "Heading",
  indent: "Increase Level",
  italic: "Italic",
  link: "Link",
  numbers: "Numbers",
  outdent: "Decrease Level",
  quote: "Quote",
  redo: "Redo",
  remove: "Remove",
  strike: "Strikethrough",
  undo: "Undo",
  unlink: "Unlink",
  url: "URL",
  urlPlaceholder: "Enter a URL…",
  GB: "GB",
  KB: "KB",
  MB: "MB",
  PB: "PB",
  TB: "TB",
};

/* eslint-disable
    no-case-declarations,
*/

const sizes = [ lang.bytes, lang.KB, lang.MB, lang.GB, lang.TB, lang.PB ];

var file_size_formatting = {
  prefix: "IEC",
  precision: 2,

  formatter(number) {
    switch (number) {
      case 0:
        return `0 ${lang.bytes}`
      case 1:
        return `1 ${lang.byte}`
      default:
        let base;

        if (this.prefix === "SI") {
          base = 1000;
        } else if (this.prefix === "IEC") {
          base = 1024;
        }

        const exp = Math.floor(Math.log(number) / Math.log(base));
        const humanSize = number / Math.pow(base, exp);
        const string = humanSize.toFixed(this.precision);
        const withoutInsignificantZeros = string.replace(/0*$/, "").replace(/\.$/, "");
        return `${withoutInsignificantZeros} ${sizes[exp]}`
    }
  },
};

const input = {
  level2Enabled: true,

  getLevel() {
    if (this.level2Enabled && browser.supportsInputEvents) {
      return 2
    } else {
      return 0
    }
  },
  pickFiles(callback) {
    const input = makeElement("input", { type: "file", multiple: true, hidden: true, id: this.fileInputId });

    input.addEventListener("change", () => {
      callback(input.files);
      removeNode(input);
    });

    removeNode(document.getElementById(this.fileInputId));
    document.body.appendChild(input);
    input.click();
  }
};

var key_names = {
  8: "backspace",
  9: "tab",
  13: "return",
  27: "escape",
  37: "left",
  39: "right",
  46: "delete",
  68: "d",
  72: "h",
  79: "o",
};

var parser = {
  removeBlankTableCells: false,
  tableCellSeparator: " | ",
  tableRowSeparator: "\n",
};

var text_attributes = {
  bold: {
    tagName: "strong",
    inheritable: true,
    parser(element) {
      const style = window.getComputedStyle(element);
      return style.fontWeight === "bold" || style.fontWeight >= 600
    },
  },
  italic: {
    tagName: "em",
    inheritable: true,
    parser(element) {
      const style = window.getComputedStyle(element);
      return style.fontStyle === "italic"
    },
  },
  href: {
    groupTagName: "a",
    parser(element) {
      const matchingSelector = `a:not(${attachmentSelector})`;
      const link = element.closest(matchingSelector);
      if (link) {
        return link.getAttribute("href")
      }
    },
  },
  strike: {
    tagName: "del",
    inheritable: true,
  },
  frozen: {
    style: { backgroundColor: "highlight" },
  },
};

var toolbar = {
  getDefaultHTML() {
    return `<div class="trix-button-row">
      <span class="trix-button-group trix-button-group--text-tools" data-trix-button-group="text-tools">
        <button type="button" class="trix-button trix-button--icon trix-button--icon-bold" data-trix-attribute="bold" data-trix-key="b" title="${lang.bold}" tabindex="-1">${lang.bold}</button>
        <button type="button" class="trix-button trix-button--icon trix-button--icon-italic" data-trix-attribute="italic" data-trix-key="i" title="${lang.italic}" tabindex="-1">${lang.italic}</button>
        <button type="button" class="trix-button trix-button--icon trix-button--icon-strike" data-trix-attribute="strike" title="${lang.strike}" tabindex="-1">${lang.strike}</button>
        <button type="button" class="trix-button trix-button--icon trix-button--icon-link" data-trix-attribute="href" data-trix-action="link" data-trix-key="k" title="${lang.link}" tabindex="-1">${lang.link}</button>
      </span>

      <span class="trix-button-group trix-button-group--block-tools" data-trix-button-group="block-tools">
        <button type="button" class="trix-button trix-button--icon trix-button--icon-heading-1" data-trix-attribute="heading1" title="${lang.heading1}" tabindex="-1">${lang.heading1}</button>
        <button type="button" class="trix-button trix-button--icon trix-button--icon-quote" data-trix-attribute="quote" title="${lang.quote}" tabindex="-1">${lang.quote}</button>
        <button type="button" class="trix-button trix-button--icon trix-button--icon-code" data-trix-attribute="code" title="${lang.code}" tabindex="-1">${lang.code}</button>
        <button type="button" class="trix-button trix-button--icon trix-button--icon-bullet-list" data-trix-attribute="bullet" title="${lang.bullets}" tabindex="-1">${lang.bullets}</button>
        <button type="button" class="trix-button trix-button--icon trix-button--icon-number-list" data-trix-attribute="number" title="${lang.numbers}" tabindex="-1">${lang.numbers}</button>
        <button type="button" class="trix-button trix-button--icon trix-button--icon-decrease-nesting-level" data-trix-action="decreaseNestingLevel" title="${lang.outdent}" tabindex="-1">${lang.outdent}</button>
        <button type="button" class="trix-button trix-button--icon trix-button--icon-increase-nesting-level" data-trix-action="increaseNestingLevel" title="${lang.indent}" tabindex="-1">${lang.indent}</button>
      </span>

      <span class="trix-button-group trix-button-group--file-tools" data-trix-button-group="file-tools">
        <button type="button" class="trix-button trix-button--icon trix-button--icon-attach" data-trix-action="attachFiles" title="${lang.attachFiles}" tabindex="-1">${lang.attachFiles}</button>
      </span>

      <span class="trix-button-group-spacer"></span>

      <span class="trix-button-group trix-button-group--history-tools" data-trix-button-group="history-tools">
        <button type="button" class="trix-button trix-button--icon trix-button--icon-undo" data-trix-action="undo" data-trix-key="z" title="${lang.undo}" tabindex="-1">${lang.undo}</button>
        <button type="button" class="trix-button trix-button--icon trix-button--icon-redo" data-trix-action="redo" data-trix-key="shift+z" title="${lang.redo}" tabindex="-1">${lang.redo}</button>
      </span>
    </div>

    <div class="trix-dialogs" data-trix-dialogs>
      <div class="trix-dialog trix-dialog--link" data-trix-dialog="href" data-trix-dialog-attribute="href">
        <div class="trix-dialog__link-fields">
          <input type="url" name="href" class="trix-input trix-input--dialog" placeholder="${lang.urlPlaceholder}" aria-label="${lang.url}" required data-trix-input>
          <div class="trix-button-group">
            <input type="button" class="trix-button trix-button--dialog" value="${lang.link}" data-trix-method="setAttribute">
            <input type="button" class="trix-button trix-button--dialog" value="${lang.unlink}" data-trix-method="removeAttribute">
          </div>
        </div>
      </div>
    </div>`
  },
};

const undo = { interval: 5000 };

let allAttributeNames = null;
let blockAttributeNames = null;
let textAttributeNames = null;
let listAttributeNames = null;

const getAllAttributeNames = () => {
  if (!allAttributeNames) {
    allAttributeNames = getTextAttributeNames().concat(getBlockAttributeNames());
  }
  return allAttributeNames
};

const getBlockConfig = (attributeName) => attributes[attributeName];

const getBlockAttributeNames = () => {
  if (!blockAttributeNames) {
    blockAttributeNames = Object.keys(attributes);
  }
  return blockAttributeNames
};

const getTextConfig = (attributeName) => text_attributes[attributeName];

const getTextAttributeNames = () => {
  if (!textAttributeNames) {
    textAttributeNames = Object.keys(text_attributes);
  }
  return textAttributeNames
};

const getListAttributeNames = () => {
  if (!listAttributeNames) {
    listAttributeNames = [];
    for (const key in attributes) {
      const { listAttribute } = attributes[key];
      if (listAttribute != null) {
        listAttributeNames.push(listAttribute);
      }
    }
  }
  return listAttributeNames
};

/* eslint-disable
*/
const installDefaultCSSForTagName = function(tagName, defaultCSS) {
  const styleElement = insertStyleElementForTagName(tagName);
  styleElement.textContent = defaultCSS.replace(/%t/g, tagName);
};

const insertStyleElementForTagName = function(tagName) {
  const element = document.createElement("style");
  element.setAttribute("type", "text/css");
  element.setAttribute("data-tag-name", tagName.toLowerCase());
  const nonce = getCSPNonce();
  if (nonce) {
    element.setAttribute("nonce", nonce);
  }
  document.head.insertBefore(element, document.head.firstChild);
  return element
};

const getCSPNonce = function() {
  const element = getMetaElement("trix-csp-nonce") || getMetaElement("csp-nonce");
  if (element) {
    return element.getAttribute("content")
  }
};

const getMetaElement = (name) => document.head.querySelector(`meta[name=${name}]`);

const testTransferData = { "application/x-trix-feature-detection": "test" };

const dataTransferIsPlainText = function(dataTransfer) {
  const text = dataTransfer.getData("text/plain");
  const html = dataTransfer.getData("text/html");

  if (text && html) {
    const { body } = new DOMParser().parseFromString(html, "text/html");
    if (body.textContent === text) {
      return !body.querySelector("*")
    }
  } else {
    return text?.length
  }
};

const dataTransferIsMsOfficePaste = ({ dataTransfer }) => {
  return dataTransfer.types.includes("Files") &&
    dataTransfer.types.includes("text/html") &&
    dataTransfer.getData("text/html").includes("urn:schemas-microsoft-com:office:office")
};

const dataTransferIsWritable = function(dataTransfer) {
  if (!dataTransfer?.setData) return false

  for (const key in testTransferData) {
    const value = testTransferData[key];

    try {
      dataTransfer.setData(key, value);
      if (!dataTransfer.getData(key) === value) return false
    } catch (error) {
      return false
    }
  }
  return true
};

const keyEventIsKeyboardCommand = (function() {
  if (/Mac|^iP/.test(navigator.platform)) {
    return (event) => event.metaKey
  } else {
    return (event) => event.ctrlKey
  }
})();

const defer = (fn) => setTimeout(fn, 1);

/* eslint-disable
    id-length,
*/
const copyObject = function(object = {}) {
  const result = {};
  for (const key in object) {
    const value = object[key];
    result[key] = value;
  }
  return result
};

const objectsAreEqual = function(a = {}, b = {}) {
  if (Object.keys(a).length !== Object.keys(b).length) {
    return false
  }
  for (const key in a) {
    const value = a[key];
    if (value !== b[key]) {
      return false
    }
  }
  return true
};

const normalizeRange = function(range) {
  if (range == null) return

  if (!Array.isArray(range)) {
    range = [ range, range ];
  }
  return [ copyValue(range[0]), copyValue(range[1] != null ? range[1] : range[0]) ]
};

const rangeIsCollapsed = function(range) {
  if (range == null) return

  const [ start, end ] = normalizeRange(range);
  return rangeValuesAreEqual(start, end)
};

const rangesAreEqual = function(leftRange, rightRange) {
  if (leftRange == null || rightRange == null) return

  const [ leftStart, leftEnd ] = normalizeRange(leftRange);
  const [ rightStart, rightEnd ] = normalizeRange(rightRange);
  return rangeValuesAreEqual(leftStart, rightStart) && rangeValuesAreEqual(leftEnd, rightEnd)
};

const copyValue = function(value) {
  if (typeof value === "number") {
    return value
  } else {
    return copyObject(value)
  }
};

const rangeValuesAreEqual = function(left, right) {
  if (typeof left === "number") {
    return left === right
  } else {
    return objectsAreEqual(left, right)
  }
};

class BasicObject {
  static proxyMethod(expression) {
    const { name, toMethod, toProperty, optional } = parseProxyMethodExpression(expression);

    this.prototype[name] = function() {
      let subject;
      let object;

      if (toMethod) {
        if (optional) {
          object = this[toMethod]?.();
        } else {
          object = this[toMethod]();
        }
      } else if (toProperty) {
        object = this[toProperty];
      }

      if (optional) {
        subject = object?.[name];
        if (subject) {
          return apply.call(subject, object, arguments)
        }
      } else {
        subject = object[name];
        return apply.call(subject, object, arguments)
      }
    };
  }
}

const parseProxyMethodExpression = function(expression) {
  const match = expression.match(proxyMethodExpressionPattern);
  if (!match) {
    throw new Error(`can't parse @proxyMethod expression: ${expression}`)
  }

  const args = { name: match[4] };

  if (match[2] != null) {
    args.toMethod = match[1];
  } else {
    args.toProperty = match[1];
  }

  if (match[3] != null) {
    args.optional = true;
  }

  return args
};

const { apply } = Function.prototype;

const proxyMethodExpressionPattern = new RegExp("\
^\
(.+?)\
(\\(\\))?\
(\\?)?\
\\.\
(.+?)\
$\
");

class SelectionChangeObserver extends BasicObject {
  constructor() {
    super(...arguments);
    this.update = this.update.bind(this);
    this.selectionManagers = [];
  }

  start() {
    if (!this.started) {
      this.started = true;
      document.addEventListener("selectionchange", this.update, true);
    }
  }

  stop() {
    if (this.started) {
      this.started = false;
      return document.removeEventListener("selectionchange", this.update, true)
    }
  }

  registerSelectionManager(selectionManager) {
    if (!this.selectionManagers.includes(selectionManager)) {
      this.selectionManagers.push(selectionManager);
      return this.start()
    }
  }

  unregisterSelectionManager(selectionManager) {
    this.selectionManagers = this.selectionManagers.filter((sm) => sm !== selectionManager);
    if (this.selectionManagers.length === 0) {
      return this.stop()
    }
  }

  notifySelectionManagersOfSelectionChange() {
    return this.selectionManagers.map((selectionManager) => selectionManager.selectionDidChange())
  }

  update() {
    this.notifySelectionManagersOfSelectionChange();
  }

  reset() {
    this.update();
  }
}

const selectionChangeObserver = new SelectionChangeObserver();

const getDOMSelection = function() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    return selection
  }
};

const getDOMRange = function() {
  const domRange = getDOMSelection()?.getRangeAt(0);
  if (domRange) {
    if (!domRangeIsPrivate(domRange)) {
      return domRange
    }
  }
};

const setDOMRange = function(domRange) {
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(domRange);
  return selectionChangeObserver.update()
};

// In Firefox, clicking certain <input> elements changes the selection to a
// private element used to draw its UI. Attempting to access properties of those
// elements throws an error.
// https://bugzilla.mozilla.org/show_bug.cgi?id=208427
const domRangeIsPrivate = (domRange) => nodeIsPrivate(domRange.startContainer) || nodeIsPrivate(domRange.endContainer);

const nodeIsPrivate = (node) => !Object.getPrototypeOf(node);

class UTF16String extends BasicObject {
  static box(value = "") {
    if (value instanceof this) {
      return value
    } else {
      return this.fromUCS2String(value?.toString())
    }
  }

  static fromUCS2String(ucs2String) {
    return new this(ucs2String, ucs2decode(ucs2String))
  }

  static fromCodepoints(codepoints) {
    return new this(ucs2encode(codepoints), codepoints)
  }

  constructor(ucs2String, codepoints) {
    super(...arguments);
    this.ucs2String = ucs2String;
    this.codepoints = codepoints;
    this.length = this.codepoints.length;
    this.ucs2Length = this.ucs2String.length;
  }

  offsetToUCS2Offset(offset) {
    return ucs2encode(this.codepoints.slice(0, Math.max(0, offset))).length
  }

  offsetFromUCS2Offset(ucs2Offset) {
    return ucs2decode(this.ucs2String.slice(0, Math.max(0, ucs2Offset))).length
  }

  slice() {
    return this.constructor.fromCodepoints(this.codepoints.slice(...arguments))
  }

  charAt(offset) {
    return this.slice(offset, offset + 1)
  }

  isEqualTo(value) {
    return this.constructor.box(value).ucs2String === this.ucs2String
  }

  toJSON() {
    return this.ucs2String
  }

  getCacheKey() {
    return this.ucs2String
  }

  toString() {
    return this.ucs2String
  }
}

const hasArrayFrom = Array.from?.("\ud83d\udc7c").length === 1;
const hasStringCodePointAt = " ".codePointAt?.(0) != null;
const hasStringFromCodePoint = String.fromCodePoint?.(32, 128124) === " \ud83d\udc7c";

// UCS-2 conversion helpers ported from Mathias Bynens' Punycode.js:
// https://github.com/bestiejs/punycode.js#punycodeucs2

let ucs2decode, ucs2encode;

// Creates an array containing the numeric code points of each Unicode
// character in the string. While JavaScript uses UCS-2 internally,
// this function will convert a pair of surrogate halves (each of which
// UCS-2 exposes as separate characters) into a single code point,
// matching UTF-16.
if (hasArrayFrom && hasStringCodePointAt) {
  ucs2decode = (string) => Array.from(string).map((char) => char.codePointAt(0));
} else {
  ucs2decode = function(string) {
    const output = [];
    let counter = 0;
    const { length } = string;

    while (counter < length) {
      let value = string.charCodeAt(counter++);
      if (0xd800 <= value && value <= 0xdbff && counter < length) {
        // high surrogate, and there is a next character
        const extra = string.charCodeAt(counter++);
        if ((extra & 0xfc00) === 0xdc00) {
          // low surrogate
          value = ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
        } else {
          // unmatched surrogate; only append this code unit, in case the
          // next code unit is the high surrogate of a surrogate pair
          counter--;
        }
      }
      output.push(value);
    }

    return output
  };
}

// Creates a string based on an array of numeric code points.
if (hasStringFromCodePoint) {
  ucs2encode = (array) => String.fromCodePoint(...Array.from(array || []));
} else {
  ucs2encode = function(array) {
    const characters = (() => {
      const result = [];

      Array.from(array).forEach((value) => {
        let output = "";
        if (value > 0xffff) {
          value -= 0x10000;
          output += String.fromCharCode(value >>> 10 & 0x3ff | 0xd800);
          value = 0xdc00 | value & 0x3ff;
        }
        result.push(output + String.fromCharCode(value));
      });

      return result
    })();

    return characters.join("")
  };
}

/* eslint-disable
    id-length,
    no-useless-escape,
*/

const normalizeSpaces = (string) =>
  string.replace(new RegExp(`${ZERO_WIDTH_SPACE}`, "g"), "").replace(new RegExp(`${NON_BREAKING_SPACE}`, "g"), " ");

const normalizeNewlines = (string) => string.replace(/\r\n?/g, "\n");

const breakableWhitespacePattern = new RegExp(`[^\\S${NON_BREAKING_SPACE}]`);

const squishBreakableWhitespace = (string) =>
  string
    // Replace all breakable whitespace characters with a space
    .replace(new RegExp(`${breakableWhitespacePattern.source}`, "g"), " ")
    // Replace two or more spaces with a single space
    .replace(/\ {2,}/g, " ");

const summarizeStringChange = function(oldString, newString) {
  let added, removed;
  oldString = UTF16String.box(oldString);
  newString = UTF16String.box(newString);

  if (newString.length < oldString.length) {
    [ removed, added ] = utf16StringDifferences(oldString, newString);
  } else {
    [ added, removed ] = utf16StringDifferences(newString, oldString);
  }

  return { added, removed }
};

const utf16StringDifferences = function(a, b) {
  if (a.isEqualTo(b)) {
    return [ "", "" ]
  }

  const diffA = utf16StringDifference(a, b);
  const { length } = diffA.utf16String;

  let diffB;

  if (length) {
    const { offset } = diffA;
    const codepoints = a.codepoints.slice(0, offset).concat(a.codepoints.slice(offset + length));
    diffB = utf16StringDifference(b, UTF16String.fromCodepoints(codepoints));
  } else {
    diffB = utf16StringDifference(b, a);
  }

  return [ diffA.utf16String.toString(), diffB.utf16String.toString() ]
};

const utf16StringDifference = function(a, b) {
  let leftIndex = 0;
  let rightIndexA = a.length;
  let rightIndexB = b.length;

  while (leftIndex < rightIndexA && a.charAt(leftIndex).isEqualTo(b.charAt(leftIndex))) {
    leftIndex++;
  }

  while (rightIndexA > leftIndex + 1 && a.charAt(rightIndexA - 1).isEqualTo(b.charAt(rightIndexB - 1))) {
    rightIndexA--;
    rightIndexB--;
  }

  return {
    utf16String: a.slice(leftIndex, rightIndexA),
    offset: leftIndex,
  }
};

/* eslint-disable
    id-length,
*/

installDefaultCSSForTagName("trix-inspector", `\
%t {
  display: block;
}

%t {
  position: fixed;
  background: #fff;
  border: 1px solid #444;
  border-radius: 5px;
  padding: 10px;
  font-family: sans-serif;
  font-size: 12px;
  overflow: auto;
  word-wrap: break-word;
}

%t details {
  margin-bottom: 10px;
}

%t summary:focus {
  outline: none;
}

%t details .panel {
  padding: 10px;
}

%t .performance .metrics {
  margin: 0 0 5px 5px;
}

%t .selection .characters {
  margin-top: 10px;
}

%t .selection .character {
  display: inline-block;
  font-size: 8px;
  font-family: courier, monospace;
  line-height: 10px;
  vertical-align: middle;
  text-align: center;
  width: 10px;
  height: 10px;
  margin: 0 1px 1px 0;
  border: 1px solid #333;
  border-radius: 1px;
  background: #676666;
  color: #fff;
}

%t .selection .character.selected {
  background: yellow;
  color: #000;
}\
`);

class TrixInspector extends HTMLElement {
  connectedCallback() {
    this.editorElement = document.querySelector(`trix-editor[trix-id='${this.dataset.trixId}']`);
    this.views = this.createViews();

    this.views.forEach((view) => {
      view.render();
      this.appendChild(view.element);
    });

    this.reposition();

    this.resizeHandler = this.reposition.bind(this);
    addEventListener("resize", this.resizeHandler);
  }

  disconnectedCallback() {
    removeEventListener("resize", this.resizeHandler);
  }

  createViews() {
    const views = Trix.Inspector.views.map((View) => new View(this.editorElement));

    return views.sort((a, b) => a.title.toLowerCase() > b.title.toLowerCase())
  }

  reposition() {
    const { top, right } = this.editorElement.getBoundingClientRect();

    this.style.top = `${top}px`;
    this.style.left = `${right + 10}px`;
    this.style.maxWidth = `${window.innerWidth - right - 40}px`;
    this.style.maxHeight = `${window.innerHeight - top - 30}px`;
  }
}

window.customElements.define("trix-inspector", TrixInspector);

window.Trix.Inspector = {
  views: [],

  registerView(constructor) {
    return this.views.push(constructor)
  },

  install(editorElement) {
    this.editorElement = editorElement;
    const element = document.createElement("trix-inspector");
    element.dataset.trixId = this.editorElement.trixId;
    return document.body.appendChild(element)
  },
};

if (!window.JST) window.JST = {};

window.JST["trix/inspector/templates/debug"] = function() {
  return `<p>
  <label>
    <input type="checkbox" name="viewCaching" checked="${this.compositionController.isViewCachingEnabled()}">
    Cache views between renders
  </label>
</p>

<p>
  <button data-action="render">Force Render</button> <button data-action="parse">Parse current HTML</button>
</p>

<p>
  <label>
    <input type="checkbox" name="controlElement">
    Show <code>contenteditable</code> control element
  </label>
</p>` };

if (!window.JST) window.JST = {};

window.JST["trix/inspector/templates/document"] = function() {
  const details = this.document.getBlocks().map((block, index) => {
    const { text } = block;
    const pieces = text.pieceList.toArray();

    return `<details class="block">
      <summary class="title">
        Block ${block.id}, Index: ${index}
      </summary>
      <div class="attributes">
        Attributes: ${JSON.stringify(block.attributes)}
      </div>

      <div class="htmlAttributes">
        HTML Attributes: ${JSON.stringify(block.htmlAttributes)}
      </div>

      <div class="text">
        <div class="title">
          Text: ${text.id}, Pieces: ${pieces.length}, Length: ${text.getLength()}
        </div>
        <div class="pieces">
          ${piecePartials(pieces).join("\n")}
        </div>
      </div>
    </details>`
  });

  return details.join("\n")
};

const piecePartials = (pieces) =>
  pieces.map((piece, index) =>`<div class="piece">
      <div class="title">
        Piece ${piece.id}, Index: ${index}
      </div>
      <div class="attributes">
        Attributes: ${JSON.stringify(piece.attributes)}
      </div>
      <div class="content">
        ${JSON.stringify(piece.toString())}
      </div>
    </div>`);

if (!window.JST) window.JST = {};

window.JST["trix/inspector/templates/performance"] = function() {
  return Object.keys(this.data).map((name) => {
      const data = this.data[name];
      return dataMetrics(name, data, this.round)
  }).join("\n")
};

const dataMetrics = function(name, data, round) {
  let item = `<strong>${name}</strong> (${data.calls})<br>`;

  if (data.calls > 0) {
    item += `<div class="metrics">
        Mean: ${round(data.mean)}ms<br>
        Max: ${round(data.max)}ms<br>
        Last: ${round(data.last)}ms
      </div>`;

    return item
  }
};

if (!window.JST) window.JST = {};

window.JST["trix/inspector/templates/render"] = () => `Syncs: ${window.syncCount}`;

if (!window.JST) window.JST = {};

window.JST["trix/inspector/templates/selection"] = function() {
  return `Location range: [${this.locationRange[0].index}:${this.locationRange[0].offset}, ${this.locationRange[1].index}:${this.locationRange[1].offset}]
    ${charSpans(this.characters).join("\n")}`
};

const charSpans = (characters) =>
  Array.from(characters).map(
    (char) => `<span class="character ${char.selected ? "selected" : undefined}">${char.string}</span>`
  );

if (!window.JST) window.JST = {};

window.JST["trix/inspector/templates/undo"] = () =>
  `<h4>Undo stack</h4>
    <ol class="undo-entries">
      ${entryList(window.undoEntries)}
    </ol>
    <h4>Redo stack</h4>
    <ol class="redo-entries">
      ${entryList(window.redoEntries)}
    </ol>`;

const entryList = (entries) =>
  entries.map((entry) =>
    `<li>${entry.description} ${JSON.stringify({
      selectedRange: entry.snapshot.selectedRange,
      context: entry.context,
    })}</li>`);

const KEY_EVENTS = "keydown keypress input".split(" ");
const COMPOSITION_EVENTS = "compositionstart compositionupdate compositionend textInput".split(" ");
const OBSERVER_OPTIONS = {
  attributes: true,
  childList: true,
  characterData: true,
  characterDataOldValue: true,
  subtree: true,
};

class ControlElement {
  constructor(editorElement) {
    this.didMutate = this.didMutate.bind(this);
    this.editorElement = editorElement;
    this.install();
  }

  install() {
    this.createElement();
    this.logInputEvents();
    this.logMutations();
  }

  uninstall() {
    this.observer.disconnect();
    this.element.parentNode.removeChild(this.element);
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.setAttribute("contenteditable", "");
    this.element.style.width = getComputedStyle(this.editorElement).width;
    this.element.style.minHeight = "50px";
    this.element.style.border = "1px solid green";
    this.editorElement.parentNode.insertBefore(this.element, this.editorElement.nextSibling);
  }

  logInputEvents() {
    KEY_EVENTS.forEach((eventName) => {
      this.element.addEventListener(eventName, (event) => console.log(`${event.type}: keyCode = ${event.keyCode}`));
    });

    COMPOSITION_EVENTS.forEach((eventName) => {
      this.element.addEventListener(eventName, (event) =>
        console.log(`${event.type}: data = ${JSON.stringify(event.data)}`)
      );
    });
  }

  logMutations() {
    this.observer = new window.MutationObserver(this.didMutate);
    this.observer.observe(this.element, OBSERVER_OPTIONS);
  }

  didMutate(mutations) {
    console.log(`Mutations (${mutations.length}):`);
    for (let index = 0; index < mutations.length; index++) {
      const mutation = mutations[index];
      console.log(` ${index + 1}. ${mutation.type}:`);
      switch (mutation.type) {
        case "characterData":
          console.log(`  oldValue = ${JSON.stringify(mutation.oldValue)}, newValue = ${JSON.stringify(mutation.target.data)}`);
          break
        case "childList":
          Array.from(mutation.addedNodes).forEach((node) => {
            console.log(`  node added ${inspectNode(node)}`);
          });

          Array.from(mutation.removedNodes).forEach((node) => {
            console.log(`  node removed ${inspectNode(node)}`);
          });
      }
    }
  }
}

const inspectNode = function(node) {
  if (node.data) {
    return JSON.stringify(node.data)
  } else {
    return JSON.stringify(node.outerHTML)
  }
};

class View {
  constructor(editorElement) {
    this.editorElement = editorElement;
    this.editorController = this.editorElement.editorController;
    this.editor = this.editorElement.editor;
    this.compositionController = this.editorController.compositionController;
    this.composition = this.editorController.composition;

    this.element = document.createElement("details");
    if (this.getSetting("open") === "true") {
      this.element.open = true;
    }
    this.element.classList.add(this.constructor.template);

    this.titleElement = document.createElement("summary");
    this.element.appendChild(this.titleElement);

    this.panelElement = document.createElement("div");
    this.panelElement.classList.add("panel");
    this.element.appendChild(this.panelElement);

    this.element.addEventListener("toggle", (event) => {
      if (event.target === this.element) {
        return this.didToggle()
      }
    });

    if (this.events) {
      this.installEventHandlers();
    }
  }

  installEventHandlers() {
    for (const eventName in this.events) {
      const handler = this.events[eventName];
      const callback = (event) => {
        requestAnimationFrame(() => {
          handler.call(this, event);
        });
      };

      handleEvent(eventName, { onElement: this.editorElement, withCallback: callback });
    }
  }

  didToggle(event) {
    this.saveSetting("open", this.isOpen());
    return this.render()
  }

  isOpen() {
    return this.element.hasAttribute("open")
  }

  getTitle() {
    return this.title || ""
  }

  render() {
    this.renderTitle();
    if (this.isOpen()) {
      this.panelElement.innerHTML = window.JST[`trix/inspector/templates/${this.constructor.template}`].apply(this);
    }
  }

  renderTitle() {
    this.titleElement.innerHTML = this.getTitle();
  }

  getSetting(key) {
    key = this.getSettingsKey(key);
    return window.sessionStorage?.[key]
  }

  saveSetting(key, value) {
    key = this.getSettingsKey(key);
    if (window.sessionStorage) {
      window.sessionStorage[key] = value;
    }
  }

  getSettingsKey(key) {
    return `trix/inspector/${this.template}/${key}`
  }

  get title() {
    return this.constructor.title
  }

  get template() {
    return this.constructor.template
  }

  get events() {
    return this.constructor.events
  }
}

class DebugView extends View {
  static title = "Debug"
  static template = "debug"

  constructor() {
    super(...arguments);
    this.didToggleViewCaching = this.didToggleViewCaching.bind(this);
    this.didClickRenderButton = this.didClickRenderButton.bind(this);
    this.didClickParseButton = this.didClickParseButton.bind(this);
    this.didToggleControlElement = this.didToggleControlElement.bind(this);

    handleEvent("change", {
      onElement: this.element,
      matchingSelector: "input[name=viewCaching]",
      withCallback: this.didToggleViewCaching,
    });
    handleEvent("click", {
      onElement: this.element,
      matchingSelector: "button[data-action=render]",
      withCallback: this.didClickRenderButton,
    });
    handleEvent("click", {
      onElement: this.element,
      matchingSelector: "button[data-action=parse]",
      withCallback: this.didClickParseButton,
    });
    handleEvent("change", {
      onElement: this.element,
      matchingSelector: "input[name=controlElement]",
      withCallback: this.didToggleControlElement,
    });
  }

  didToggleViewCaching({ target }) {
    if (target.checked) {
      return this.compositionController.enableViewCaching()
    } else {
      return this.compositionController.disableViewCaching()
    }
  }

  didClickRenderButton() {
    return this.editorController.render()
  }

  didClickParseButton() {
    return this.editorController.reparse()
  }

  didToggleControlElement({ target }) {
    if (target.checked) {
      this.control = new Trix.Inspector.ControlElement(this.editorElement);
    } else {
      this.control?.uninstall();
      this.control = null;
    }
  }
}

Trix.Inspector.registerView(DebugView);

class DocumentView extends View {
  static title = "Document"
  static template = "document"
  static events = {
    "trix-change": function() {
      return this.render()
    },
  }

  render() {
    this.document = this.editor.getDocument();
    return super.render(...arguments)
  }
}

Trix.Inspector.registerView(DocumentView);

const now = window.performance?.now ? () => performance.now() : () => new Date().getTime();

class PerformanceView extends View {
  static title = "Performance"
  static template = "performance"

  constructor() {
    super(...arguments);
    this.documentView = this.compositionController.documentView;

    this.data = {};
    this.track("documentView.render");
    this.track("documentView.sync");
    this.track("documentView.garbageCollectCachedViews");
    this.track("composition.replaceHTML");

    this.render();
  }

  track(methodPath) {
    this.data[methodPath] = { calls: 0, total: 0, mean: 0, max: 0, last: 0 };
    const parts = methodPath.split(".");
    const propertyNames = parts.slice(0, parts.length - 1);
    const methodName = parts[parts.length - 1];

    let object = this;

    propertyNames.forEach((propertyName) => {
      object = object[propertyName];
    });

    const original = object[methodName];

    object[methodName] = function() {
      const started = now();
      const result = original.apply(object, arguments);
      const timing = now() - started;
      this.record(methodPath, timing);
      return result
    }.bind(this);
  }

  record(methodPath, timing) {
    const data = this.data[methodPath];
    data.calls += 1;
    data.total += timing;
    data.mean = data.total / data.calls;
    if (timing > data.max) {
      data.max = timing;
    }
    data.last = timing;
    return this.render()
  }

  round(ms) {
    return Math.round(ms * 1000) / 1000
  }
}

Trix.Inspector.registerView(PerformanceView);

class RenderView extends View {
  static title = "Renders"
  static template = "render"
  static events = {
    "trix-render": function() {
      this.renderCount++;
      return this.render()
    },

    "trix-sync": function() {
      this.syncCount++;
      return this.render()
    },
  }

  constructor() {
    super(...arguments);
    this.renderCount = 0;
    this.syncCount = 0;
  }

  getTitle() {
    return `${this.title} (${this.renderCount})`
  }
}

Trix.Inspector.registerView(RenderView);

class SelectionView extends View {
  static title = "Selection"
  static template = "selection"
  static events = {
    "trix-selection-change": function() {
      return this.render()
    },
    "trix-render": function() {
      return this.render()
    },
  }

  render() {
    this.document = this.editor.getDocument();
    this.range = this.editor.getSelectedRange();
    this.locationRange = this.composition.getLocationRange();
    this.characters = this.getCharacters();
    return super.render(...arguments)
  }

  getCharacters() {
    const chars = [];
    const utf16string = UTF16String.box(this.document.toString());
    const rangeIsExpanded = this.range[0] !== this.range[1];
    let position = 0;
    while (position < utf16string.length) {
      let string = utf16string.charAt(position).toString();
      if (string === "\n") {
        string = "⏎";
      }
      const selected = rangeIsExpanded && position >= this.range[0] && position < this.range[1];
      chars.push({ string, selected });
      position++;
    }
    return chars
  }

  getTitle() {
    return `${this.title} (${this.range.join()})`
  }
}

Trix.Inspector.registerView(SelectionView);

class UndoView extends View {
  static title = "Undo"
  static template = "undo"
  static events = {
    "trix-change": function() {
      return this.render()
    },
  }

  render() {
    this.undoEntries = this.editor.undoManager.undoEntries;
    this.redoEntries = this.editor.undoManager.redoEntries;
    return super.render(...arguments)
  }
}

Trix.Inspector.registerView(UndoView);
//# sourceMappingURL=inspector.js.map
