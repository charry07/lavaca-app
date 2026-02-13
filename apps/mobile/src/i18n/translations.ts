export type Locale = 'es' | 'en' | 'pt';

export const LOCALE_LABELS: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  es: '🇨🇴',
  en: '🇺🇸',
  pt: '🇧🇷',
};

type TranslationKeys = typeof es;

const es = {
  // Navigation
  'nav.createTable': 'Crear Mesa',
  'nav.joinTable': 'Unirme a Mesa',
  'nav.theTable': 'La Mesa',

  // Home
  'home.tagline': 'Simple y sencillo de dividir\ny pagar cuentas',
  'home.quickExample': 'Ejemplo rapido',
  'home.totalBill': 'Cuenta total:',
  'home.perPerson': 'Entre {{count}} personas: {{amount}} c/u',
  'home.createTable': '🍽️  Crear Mesa',
  'home.joinTable': '🔗  Unirme a Mesa',

  // Create
  'create.totalAmount': 'Monto total',
  'create.description': 'Descripcion (opcional)',
  'create.descriptionPlaceholder': 'Ej: Almuerzo con los parceros',
  'create.howToSplit': 'Como dividimos?',
  'create.equalParts': 'Partes iguales',
  'create.percentage': 'Porcentajes',
  'create.roulette': 'Ruleta',
  'create.createButton': 'Crear Mesa 🐄',
  'create.invalidAmount': 'Ingresa un monto valido',
  'create.errorCreating': 'No se pudo crear la mesa',

  // Join
  'join.title': 'Unirme a una mesa',
  'join.subtitle': 'Ingresa el codigo que te compartieron',
  'join.yourName': 'Tu nombre',
  'join.joinButton': 'Unirme 🐄',
  'join.noCode': 'Ingresa el codigo de la mesa',
  'join.noName': 'Ingresa tu nombre',
  'join.errorJoining': 'No se pudo unir a la mesa',

  // Session
  'session.notFound': 'Mesa no encontrada',
  'session.code': 'Codigo:',
  'session.share': 'Compartir',
  'session.total': 'Total',
  'session.people': 'Personas',
  'session.mode': 'Modo',
  'session.equalMode': '⚖️ Partes iguales',
  'session.percentageMode': '📊 Porcentajes',
  'session.rouletteMode': '🎰 Ruleta',
  'session.paid': '✅ Pagado',
  'session.pending': '⏳ Pendiente',
  'session.payButton': 'Pagar',
  'session.noParticipants': 'Aun no hay participantes.\nComparte el codigo para que se unan!',
  'session.splitButton': 'Dividir Cuenta 🐄',
  'session.allPaid': '🎉 Todos pagaron! Cuenta cerrada',
  'session.paidCount': '{{paid}}/{{total}} pagaron',
  'session.shareTitle': 'Compartir Mesa 🐄',
  'session.scanToJoin': 'Escanea para unirte',
  'session.sendMessage': '📤  Enviar por mensaje',
  'session.copyLink': '🔗  Copiar enlace',
  'session.close': 'Cerrar',
  'session.shareMessage': 'Unete a La Vaca! 🐄\n\nCodigo: {{code}}\n\nDescarga la app para dividir y pagar la cuenta facilmente.',

  // Roulette
  'roulette.title': '🎰 Ruleta de La Vaca',
  'roulette.spinning': 'Girando...',
  'roulette.result': '¡Ya salio!',
  'roulette.winner': '¡{{name}} paga todo!',
  'roulette.betterLuck': 'Suerte para la proxima 😂',

  // Common
  'common.error': 'Error',

  // Tabs
  'tabs.home': 'Inicio',
  'tabs.feed': 'Actividad',
  'tabs.profile': 'Perfil',

  // Auth
  'auth.welcome': 'Bienvenido a La Vaca 🐄',
  'auth.subtitle': 'Completa tus datos para empezar',
  'auth.nameLabel': 'Nombre completo',
  'auth.namePlaceholder': 'Ej: Anderson Charry',
  'auth.usernameLabel': 'Nombre de usuario',
  'auth.usernamePlaceholder': 'Ej: anderson.charry',
  'auth.phoneLabel': 'Celular',
  'auth.phonePlaceholder': 'Ej: 3001234567',
  'auth.documentLabel': 'Documento de identidad (opcional)',
  'auth.documentPlaceholder': 'Ej: 1234567890',
  'auth.enterButton': 'Entrar \ud83d\udc04',
  'auth.invalidPhone': 'Ingresa un numero valido',
  'auth.invalidUsername': 'El usuario debe tener al menos 3 caracteres',
  'auth.noName': 'Ingresa tu nombre',
  'auth.errorRegistering': 'No se pudo registrar',
  'auth.hint': 'Tu celular es tu identidad. Sin contrasenas, simple y sencillo.',

  // Feed
  'feed.empty': 'No hay actividad aun',
  'feed.emptyHint': 'Crea o unete a una mesa para ver actividad aqui',

  // Profile
  'profile.name': 'Nombre',
  'profile.username': 'Usuario',
  'profile.phone': 'Celular',
  'profile.document': 'Documento',
  'profile.memberSince': 'Miembro desde',
  'profile.permissionNeeded': 'Se necesita permiso para acceder a tus fotos',
  'profile.logout': 'Cerrar sesion',
  'profile.logoutTitle': 'Cerrar sesion',
  'profile.logoutMessage': 'Seguro que quieres salir?',
  'profile.logoutConfirm': 'Salir',
  'profile.cancel': 'Cancelar',
};

const en: TranslationKeys = {
  // Navigation
  'nav.createTable': 'Create Table',
  'nav.joinTable': 'Join Table',
  'nav.theTable': 'The Table',

  // Home
  'home.tagline': 'Simple and easy to split\nand pay bills',
  'home.quickExample': 'Quick example',
  'home.totalBill': 'Total bill:',
  'home.perPerson': 'Between {{count}} people: {{amount}} each',
  'home.createTable': '🍽️  Create Table',
  'home.joinTable': '🔗  Join Table',

  // Create
  'create.totalAmount': 'Total amount',
  'create.description': 'Description (optional)',
  'create.descriptionPlaceholder': 'Ex: Lunch with friends',
  'create.howToSplit': 'How do we split?',
  'create.equalParts': 'Equal parts',
  'create.percentage': 'Percentages',
  'create.roulette': 'Roulette',
  'create.createButton': 'Create Table 🐄',
  'create.invalidAmount': 'Enter a valid amount',
  'create.errorCreating': 'Could not create the table',

  // Join
  'join.title': 'Join a table',
  'join.subtitle': 'Enter the code they shared with you',
  'join.yourName': 'Your name',
  'join.joinButton': 'Join 🐄',
  'join.noCode': 'Enter the table code',
  'join.noName': 'Enter your name',
  'join.errorJoining': 'Could not join the table',

  // Session
  'session.notFound': 'Table not found',
  'session.code': 'Code:',
  'session.share': 'Share',
  'session.total': 'Total',
  'session.people': 'People',
  'session.mode': 'Mode',
  'session.equalMode': '⚖️ Equal parts',
  'session.percentageMode': '📊 Percentages',
  'session.rouletteMode': '🎰 Roulette',
  'session.paid': '✅ Paid',
  'session.pending': '⏳ Pending',
  'session.payButton': 'Pay',
  'session.noParticipants': 'No participants yet.\nShare the code so they can join!',
  'session.splitButton': 'Split Bill 🐄',
  'session.allPaid': '🎉 Everyone paid! Bill closed',
  'session.paidCount': '{{paid}}/{{total}} paid',
  'session.shareTitle': 'Share Table 🐄',
  'session.scanToJoin': 'Scan to join',
  'session.sendMessage': '📤  Send by message',
  'session.copyLink': '🔗  Copy link',
  'session.close': 'Close',
  'session.shareMessage': 'Join La Vaca! 🐄\n\nCode: {{code}}\n\nDownload the app to split and pay bills easily.',

  // Roulette
  'roulette.title': '🎰 La Vaca Roulette',
  'roulette.spinning': 'Spinning...',
  'roulette.result': 'Here it is!',
  'roulette.winner': '{{name}} pays everything!',
  'roulette.betterLuck': 'Better luck next time 😂',

  // Common
  'common.error': 'Error',

  // Tabs
  'tabs.home': 'Home',
  'tabs.feed': 'Activity',
  'tabs.profile': 'Profile',

  // Auth
  'auth.welcome': 'Welcome to La Vaca 🐄',
  'auth.subtitle': 'Fill in your details to get started',
  'auth.nameLabel': 'Full name',
  'auth.namePlaceholder': 'Ex: John Smith',
  'auth.usernameLabel': 'Username',
  'auth.usernamePlaceholder': 'Ex: john.smith',
  'auth.phoneLabel': 'Phone',
  'auth.phonePlaceholder': 'Ex: 3001234567',
  'auth.documentLabel': 'ID document (optional)',
  'auth.documentPlaceholder': 'Ex: 1234567890',
  'auth.enterButton': 'Enter 🐄',
  'auth.invalidPhone': 'Enter a valid number',
  'auth.invalidUsername': 'Username must be at least 3 characters',
  'auth.noName': 'Enter your name',
  'auth.errorRegistering': 'Could not register',
  'auth.hint': 'Your phone is your identity. No passwords, simple and easy.',

  // Feed
  'feed.empty': 'No activity yet',
  'feed.emptyHint': 'Create or join a table to see activity here',

  // Profile
  'profile.name': 'Name',
  'profile.username': 'Username',
  'profile.phone': 'Phone',
  'profile.document': 'ID Document',
  'profile.memberSince': 'Member since',
  'profile.permissionNeeded': 'Permission needed to access your photos',
  'profile.logout': 'Log out',
  'profile.logoutTitle': 'Log out',
  'profile.logoutMessage': 'Are you sure you want to log out?',
  'profile.logoutConfirm': 'Log out',
  'profile.cancel': 'Cancel',
};

const pt: TranslationKeys = {
  // Navigation
  'nav.createTable': 'Criar Mesa',
  'nav.joinTable': 'Entrar na Mesa',
  'nav.theTable': 'A Mesa',

  // Home
  'home.tagline': 'Simples e fácil de dividir\ne pagar contas',
  'home.quickExample': 'Exemplo rápido',
  'home.totalBill': 'Conta total:',
  'home.perPerson': 'Entre {{count}} pessoas: {{amount}} cada',
  'home.createTable': '🍽️  Criar Mesa',
  'home.joinTable': '🔗  Entrar na Mesa',

  // Create
  'create.totalAmount': 'Valor total',
  'create.description': 'Descrição (opcional)',
  'create.descriptionPlaceholder': 'Ex: Almoço com os amigos',
  'create.howToSplit': 'Como dividimos?',
  'create.equalParts': 'Partes iguais',
  'create.percentage': 'Porcentagens',
  'create.roulette': 'Roleta',
  'create.createButton': 'Criar Mesa 🐄',
  'create.invalidAmount': 'Insira um valor válido',
  'create.errorCreating': 'Não foi possível criar a mesa',

  // Join
  'join.title': 'Entrar numa mesa',
  'join.subtitle': 'Insira o código que compartilharam com você',
  'join.yourName': 'Seu nome',
  'join.joinButton': 'Entrar 🐄',
  'join.noCode': 'Insira o código da mesa',
  'join.noName': 'Insira seu nome',
  'join.errorJoining': 'Não foi possível entrar na mesa',

  // Session
  'session.notFound': 'Mesa não encontrada',
  'session.code': 'Código:',
  'session.share': 'Compartilhar',
  'session.total': 'Total',
  'session.people': 'Pessoas',
  'session.mode': 'Modo',
  'session.equalMode': '⚖️ Partes iguais',
  'session.percentageMode': '📊 Porcentagens',
  'session.rouletteMode': '🎰 Roleta',
  'session.paid': '✅ Pago',
  'session.pending': '⏳ Pendente',
  'session.payButton': 'Pagar',
  'session.noParticipants': 'Ainda não há participantes.\nCompartilhe o código para que entrem!',
  'session.splitButton': 'Dividir Conta 🐄',
  'session.allPaid': '🎉 Todos pagaram! Conta fechada',
  'session.paidCount': '{{paid}}/{{total}} pagaram',
  'session.shareTitle': 'Compartilhar Mesa 🐄',
  'session.scanToJoin': 'Escaneie para entrar',
  'session.sendMessage': '📤  Enviar por mensagem',
  'session.copyLink': '🔗  Copiar link',
  'session.close': 'Fechar',
  'session.shareMessage': 'Entre na La Vaca! 🐄\n\nCódigo: {{code}}\n\nBaixe o app para dividir e pagar contas facilmente.',

  // Roulette
  'roulette.title': '🎰 Roleta da La Vaca',
  'roulette.spinning': 'Girando...',
  'roulette.result': 'Saiu!',
  'roulette.winner': '{{name}} paga tudo!',
  'roulette.betterLuck': 'Sorte pra próxima 😂',

  // Common
  'common.error': 'Erro',

  // Tabs
  'tabs.home': 'Início',
  'tabs.feed': 'Atividade',
  'tabs.profile': 'Perfil',

  // Auth
  'auth.welcome': 'Bem-vindo ao La Vaca 🐄',
  'auth.subtitle': 'Preencha seus dados para começar',
  'auth.nameLabel': 'Nome completo',
  'auth.namePlaceholder': 'Ex: João Silva',
  'auth.usernameLabel': 'Nome de usuário',
  'auth.usernamePlaceholder': 'Ex: joao.silva',
  'auth.phoneLabel': 'Celular',
  'auth.phonePlaceholder': 'Ex: 3001234567',
  'auth.documentLabel': 'Documento de identidade (opcional)',
  'auth.documentPlaceholder': 'Ex: 1234567890',
  'auth.enterButton': 'Entrar 🐄',
  'auth.invalidPhone': 'Insira um número válido',
  'auth.invalidUsername': 'O usuário deve ter pelo menos 3 caracteres',
  'auth.noName': 'Insira seu nome',
  'auth.errorRegistering': 'Não foi possível registrar',
  'auth.hint': 'Seu celular é sua identidade. Sem senhas, simples e fácil.',

  // Feed
  'feed.empty': 'Nenhuma atividade ainda',
  'feed.emptyHint': 'Crie ou entre numa mesa para ver atividade aqui',

  // Profile
  'profile.name': 'Nome',
  'profile.username': 'Usu\u00e1rio',
  'profile.phone': 'Celular',
  'profile.document': 'Documento',
  'profile.memberSince': 'Membro desde',
  'profile.permissionNeeded': 'Permiss\u00e3o necess\u00e1ria para acessar suas fotos',
  'profile.logout': 'Sair',
  'profile.logoutTitle': 'Sair',
  'profile.logoutMessage': 'Tem certeza que quer sair?',
  'profile.logoutConfirm': 'Sair',
  'profile.cancel': 'Cancelar',
};

export const translations: Record<Locale, TranslationKeys> = { es, en, pt };
