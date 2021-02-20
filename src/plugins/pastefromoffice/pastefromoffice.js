import Clipboard from '@ckeditor/ckeditor5-clipboard/src/clipboard';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import GoogleDocsNormalizer from '@ckeditor/ckeditor5-paste-from-office/src/normalizers/googledocsnormalizer';
import MSWordNormalizer from '@ckeditor/ckeditor5-paste-from-office/src/normalizers/mswordnormalizer';

import IndentsNormalizer from './normalizers/indentsnormalizer';

export default class PasteFromOffice extends Plugin {
  static get pluginName() {
    return 'PasteFromOffice';
  }

  static get requires() {
    return [Clipboard];
  }

  init() {
    const { editor } = this;
    const viewDocument = editor.editing.view.document;
    const normalizers = [];

    normalizers.push(new MSWordNormalizer(viewDocument));
    normalizers.push(new GoogleDocsNormalizer(viewDocument));
    normalizers.push(new IndentsNormalizer(viewDocument, editor));

    editor.plugins.get('Clipboard').on(
      'inputTransformation',
      (evt, data) => {
        const htmlString = data.dataTransfer.getData('text/html');

        normalizers.forEach(normalizer => {
          if (!normalizer.isActive(htmlString)) {
            return;
          }

          normalizer.execute(data);
        });
      },
      { priority: 'high' },
    );
  }
}
