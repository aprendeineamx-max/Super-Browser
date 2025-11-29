import {createVuetify} from 'vuetify';

import {getAppTheme, addThemeListener} from 'utils/app';

const LightTheme = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    primary: '#6750A4',
    secondary: '#625B71'
  }
};

const DarkTheme = {
  dark: true,
  colors: {
    background: '#1C1B1F',
    surface: '#1C1B1F',
    primary: '#D0BCFF',
    secondary: '#CCC2DC'
  }
};

const HighContrastTheme = {
  dark: true,
  colors: {
    background: '#0A0A0A',
    surface: '#0A0A0A',
    primary: '#FFFFFF',
    secondary: '#FFD166',
    error: '#FF4D4F'
  }
};

async function configTheme(vuetify, {theme = ''} = {}) {
  async function setTheme({theme = '', dispatchChange = true} = {}) {
    if (!theme) {
      theme = await getAppTheme();
    }

    document.documentElement.setAttribute('data-theme', theme);

    const colorScheme =
      theme === 'dark' || theme === 'highContrast' ? 'dark' : 'light';
    document.documentElement.style.setProperty('color-scheme', colorScheme);
    vuetify.theme.global.name.value = theme;

    if (dispatchChange) {
      document.dispatchEvent(new CustomEvent('themeChange', {detail: theme}));
    }
  }

  addThemeListener(setTheme);

  await setTheme({theme, dispatchChange: false});
}

async function configVuetify(app) {
  const theme = await getAppTheme();

  const vuetify = createVuetify({
    theme: {
      themes: {
        light: LightTheme,
        dark: DarkTheme,
        highContrast: HighContrastTheme
      },
      defaultTheme: theme
    },
    defaults: {
      VDialog: {
        eager: true
      },
      VSelect: {
        eager: true
      },
      VSnackbar: {
        eager: true
      },
      VMenu: {
        eager: true
      }
    }
  });

  await configTheme(vuetify, {theme});

  app.use(vuetify);
}

export {configTheme, configVuetify};
