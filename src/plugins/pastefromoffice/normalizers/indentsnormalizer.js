import UpcastWriter from '@ckeditor/ckeditor5-engine/src/view/upcastwriter';

const getOffset = dim => {
  switch (dim) {
    case 'px':
      // Office 365
      return 47;
    case 'pt':
      // Google Docs
      return 12;
    default:
      return 1;
  }
};

const insertIndentMarkers = (block, indentCount) => {
  block._addClass('INDENTED_BLOCK');
  block._setAttribute('data-indent-level', indentCount);
};

function normalizeIndents(documentFragment, writer, editor) {
  const { config } = editor;

  const configuration = config.get('indentBlock');

  const useOffsetConfig = !Array.isArray(configuration.classes);

  [...documentFragment.getChildren()].forEach(child => {
    // TODO: move out to another util, when this code is needed to expand
    // Making a "paragraph" instead of "br" in the root level
    // CKEditor remove all <br /> tags
    if (child.name === 'br' && child.parent && child.parent.parent === null) {
      writer.replace(child, writer.createElement('p'));
    }

    if (child && child.getStyle) {
      const indent = child.getStyle('text-indent');
      const marginLeft = child.getStyle('margin-left');

      if (indent && useOffsetConfig) {
        const indentDim = indent.replace(/\d/g, '');
        const offset = getOffset(indentDim);
        const indentNumber = indent.replace(indentDim, '');

        if (indentNumber) {
          const indentCount = indentNumber / offset;

          insertIndentMarkers(child, indentCount);
        }
      }

      if (marginLeft && useOffsetConfig) {
        const marginLeftNumber = marginLeft.replace('px', '');
        const offset = getOffset('px');

        if (marginLeftNumber) {
          const indentCount = marginLeftNumber / offset;

          insertIndentMarkers(child, indentCount);
        }
      }
    }

    if (child.childCount) {
      normalizeIndents(child, writer, editor);
    }
  });
}

export default class IndentsNormalizer {
  constructor(document, editor) {
    this.document = document;
    this.editor = editor;
  }

  isActive() {
    return true;
  }

  execute(data) {
    const writer = new UpcastWriter(this.document);

    normalizeIndents(data.content, writer, this.editor);
  }
}
