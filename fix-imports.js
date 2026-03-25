const fs = require('fs');
const path = require('path');

const walkSync = (dir, callback) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile() && (filepath.endsWith('.tsx') || filepath.endsWith('.ts'))) {
      callback(filepath);
    }
  });
};

const components = [
  'AddButton', 'AuthFooter', 'CategoryPill', 'Divider', 'FormInput',
  'GradientButton', 'OutlinedButton', 'PickerModal', 'PrimaryButton',
  'SecondaryButton', 'SocialButton', 'ThirdButton', 'BackButton',
  'CustomTabBar', 'ProductCard', 'ServiceCard'
];

walkSync(path.join(__dirname, 'app'), (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  let changed = false;

  // Replace default component imports with named barrel imports
  // e.g., import FormInput from '@/components/FormInput'; -> import { FormInput } from '@/components';
  components.forEach((comp) => {
    const regex = new RegExp(`import\\s+${comp}\\s+from\\s+['"]@/components/${comp}['"];?`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `import { ${comp} } from '@/components';`);
      changed = true;
    }
  });

  // Replace multiple named imports from the same barrel? It's fine if they are separate for now, or we can merge them later
  // Let's replace supabase import
  content = content.replace(/@\/src\/utils\/supabase/g, '@/lib/supabase');
  if (content.includes('@/lib/supabase')) changed = true;

  if (changed) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated: ${filepath}`);
  }
});
