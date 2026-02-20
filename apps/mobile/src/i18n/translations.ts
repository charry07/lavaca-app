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
  'home.myTables': 'Mis Mesas',
  'home.noTables': 'No tienes mesas activas',
  'home.noTablesHint': 'Crea una mesa o unete a una para empezar',
  'home.open': 'Abierta',
  'home.closed': 'Cerrada',
  'home.people_one': '{{count}} persona',
  'home.people_other': '{{count}} personas',

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

  'session.copied': 'Copiado!',
  'session.copiedMessage': 'El enlace se copio al portapapeles',

  // Roulette
  'roulette.title': '🎰 Ruleta de La Vaca',
  'roulette.spinning': 'Girando...',
  'roulette.result': '¡Ya salio!',
  'roulette.winner': '¡{{name}} paga todo!',
  'roulette.betterLuck': 'Suerte para la proxima 😂',

  // Common
  'common.error': 'Error',
  'common.now': 'ahora',
  'common.person': 'persona',
  'common.people': 'personas',

  // Tabs
  'tabs.home': 'Inicio',
  'tabs.groups': 'Grupos',
  'tabs.history': 'Historial',
  'tabs.feed': 'Actividad',
  'tabs.profile': 'Perfil',

  // Auth - Phone Step
  'auth.welcome': 'Bienvenido a La Vaca 🐄',
  'auth.phoneSubtitle': 'Ingresa tu numero de celular para comenzar',
  'auth.phoneLabel': 'Celular',
  'auth.phonePlaceholder': 'Ej: 3001234567',
  'auth.sendCode': 'Enviar codigo 📱',
  'auth.invalidPhone': 'Ingresa un numero valido',
  'auth.errorSendingOTP': 'No se pudo enviar el codigo',
  'auth.hint': 'Tu celular es tu identidad. Sin contrasenas, simple y sencillo.',
  'auth.hintDev': '🔧 Modo dev: el codigo se muestra en pantalla. En produccion se envia por SMS.',
  'auth.selectCountry': 'Seleccionar pais',
  'auth.searchCountry': 'Buscar pais...',

  // Auth - OTP Step
  'auth.verifyTitle': 'Verificar numero 📱',
  'auth.verifySubtitle': 'Ingresa el codigo de 6 digitos enviado a {{phone}}',
  'auth.verifyButton': 'Verificar',
  'auth.invalidOTP': 'Ingresa el codigo completo de 6 digitos',
  'auth.errorVerifyingOTP': 'Codigo invalido o expirado',
  'auth.changePhone': 'Cambiar numero',

  // Auth - Register Step
  'auth.registerTitle': 'Completa tu perfil 🐄',
  'auth.registerSubtitle': 'Numero verificado: {{phone}}',
  'auth.nameLabel': 'Nombre completo',
  'auth.namePlaceholder': 'Ej: Anderson Charry',
  'auth.usernameLabel': 'Nombre de usuario',
  'auth.usernamePlaceholder': 'Ej: anderson.charry',
  'auth.documentLabel': 'Documento de identidad (cedula)',
  'auth.documentPlaceholder': 'Ej: 1234567890',
  'auth.registerButton': 'Crear cuenta 🐄',
  'auth.invalidUsername': 'El usuario debe tener al menos 3 caracteres',
  'auth.noName': 'Ingresa tu nombre',
  'auth.noDocument': 'El documento de identidad es obligatorio',
  'auth.errorRegistering': 'No se pudo registrar',

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

  // Groups
  'groups.empty': 'No tienes grupos aun',
  'groups.emptyHint': 'Crea un grupo con tus amigos para dividir cuentas mas rapido',
  'groups.members': 'miembros',
  'groups.createTitle': 'Crear grupo',
  'groups.nameLabel': 'Nombre del grupo',
  'groups.namePlaceholder': 'Ej: Los parceros',
  'groups.iconLabel': 'Icono',
  'groups.createButton': 'Crear grupo 🐄',
  'groups.noName': 'Ingresa un nombre para el grupo',
  'groups.deleteTitle': 'Eliminar grupo',
  'groups.deleteMessage': 'Seguro que quieres eliminar "{{name}}"?',
  'groups.deleteConfirm': 'Eliminar',
  'groups.addMembers': 'Agregar miembros',
  'groups.searchPlaceholder': 'Buscar por nombre, usuario o telefono',
  'groups.searchHint': 'Escribe al menos 2 caracteres para buscar',
  'groups.noResults': 'No se encontraron usuarios',
  'groups.alreadyMember': 'Ya es miembro',
  'groups.addButton': 'Agregar',
  'groups.memberAdded': '{{name}} fue agregado al grupo',
  'groups.removeMember': 'Quitar miembro',
  'groups.removeMessage': 'Quitar a {{name}} del grupo?',
  'groups.removeConfirm': 'Quitar',
  'groups.createSession': 'Crear mesa con este grupo',
  'groups.admin': 'Admin',
  'groups.noMembers': 'Aun no hay miembros',
  'groups.groupNotFound': 'Grupo no encontrado',

  // History
  'history.empty': 'No tienes historial aun',
  'history.emptyHint': 'Tu historial de mesas y divisiones aparecera aqui',
  'history.untitled': 'Mesa sin nombre',
  'history.myPart': 'Mi parte',
  'history.organizer': 'Organizador',
  'history.participant': 'Participante',
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
  'home.myTables': 'My Tables',
  'home.noTables': 'No active tables',
  'home.noTablesHint': 'Create a table or join one to get started',
  'home.open': 'Open',
  'home.closed': 'Closed',
  'home.people_one': '{{count}} person',
  'home.people_other': '{{count}} people',

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

  'session.copied': 'Copied!',
  'session.copiedMessage': 'Link copied to clipboard',

  // Roulette
  'roulette.title': '🎰 La Vaca Roulette',
  'roulette.spinning': 'Spinning...',
  'roulette.result': 'Here it is!',
  'roulette.winner': '{{name}} pays everything!',
  'roulette.betterLuck': 'Better luck next time 😂',

  // Common
  'common.error': 'Error',
  'common.now': 'now',
  'common.person': 'person',
  'common.people': 'people',

  // Tabs
  'tabs.home': 'Home',
  'tabs.groups': 'Groups',
  'tabs.history': 'History',
  'tabs.feed': 'Activity',
  'tabs.profile': 'Profile',

  // Auth - Phone Step
  'auth.welcome': 'Welcome to La Vaca 🐄',
  'auth.phoneSubtitle': 'Enter your phone number to get started',
  'auth.phoneLabel': 'Phone',
  'auth.phonePlaceholder': 'Ex: 3001234567',
  'auth.sendCode': 'Send code 📱',
  'auth.invalidPhone': 'Enter a valid number',
  'auth.errorSendingOTP': 'Could not send code',
  'auth.hint': 'Your phone is your identity. No passwords, simple and easy.',
  'auth.hintDev': '🔧 Dev mode: code is shown on screen. In production it will be sent via SMS.',
  'auth.selectCountry': 'Select country',
  'auth.searchCountry': 'Search country...',

  // Auth - OTP Step
  'auth.verifyTitle': 'Verify number 📱',
  'auth.verifySubtitle': 'Enter the 6-digit code sent to {{phone}}',
  'auth.verifyButton': 'Verify',
  'auth.invalidOTP': 'Enter the complete 6-digit code',
  'auth.errorVerifyingOTP': 'Invalid or expired code',
  'auth.changePhone': 'Change number',

  // Auth - Register Step
  'auth.registerTitle': 'Complete your profile 🐄',
  'auth.registerSubtitle': 'Verified number: {{phone}}',
  'auth.nameLabel': 'Full name',
  'auth.namePlaceholder': 'Ex: John Smith',
  'auth.usernameLabel': 'Username',
  'auth.usernamePlaceholder': 'Ex: john.smith',
  'auth.documentLabel': 'ID document (required)',
  'auth.documentPlaceholder': 'Ex: 1234567890',
  'auth.registerButton': 'Create account 🐄',
  'auth.invalidUsername': 'Username must be at least 3 characters',
  'auth.noName': 'Enter your name',
  'auth.noDocument': 'ID document is required',
  'auth.errorRegistering': 'Could not register',

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

  // Groups
  'groups.empty': 'No groups yet',
  'groups.emptyHint': 'Create a group with your friends to split bills faster',
  'groups.members': 'members',
  'groups.createTitle': 'Create group',
  'groups.nameLabel': 'Group name',
  'groups.namePlaceholder': 'Ex: The Squad',
  'groups.iconLabel': 'Icon',
  'groups.createButton': 'Create group 🐄',
  'groups.noName': 'Enter a name for the group',
  'groups.deleteTitle': 'Delete group',
  'groups.deleteMessage': 'Are you sure you want to delete "{{name}}"?',
  'groups.deleteConfirm': 'Delete',
  'groups.addMembers': 'Add members',
  'groups.searchPlaceholder': 'Search by name, username or phone',
  'groups.searchHint': 'Type at least 2 characters to search',
  'groups.noResults': 'No users found',
  'groups.alreadyMember': 'Already a member',
  'groups.addButton': 'Add',
  'groups.memberAdded': '{{name}} was added to the group',
  'groups.removeMember': 'Remove member',
  'groups.removeMessage': 'Remove {{name}} from the group?',
  'groups.removeConfirm': 'Remove',
  'groups.createSession': 'Create table with this group',
  'groups.admin': 'Admin',
  'groups.noMembers': 'No members yet',
  'groups.groupNotFound': 'Group not found',

  // History
  'history.empty': 'No history yet',
  'history.emptyHint': 'Your table and split history will appear here',
  'history.untitled': 'Untitled table',
  'history.myPart': 'My part',
  'history.organizer': 'Organizer',
  'history.participant': 'Participant',
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
  'home.myTables': 'Minhas Mesas',
  'home.noTables': 'Sem mesas ativas',
  'home.noTablesHint': 'Crie uma mesa ou entre em uma para começar',
  'home.open': 'Aberta',
  'home.closed': 'Fechada',
  'home.people_one': '{{count}} pessoa',
  'home.people_other': '{{count}} pessoas',

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

  'session.copied': 'Copiado!',
  'session.copiedMessage': 'Link copiado para a área de transferência',

  // Roulette
  'roulette.title': '🎰 Roleta da La Vaca',
  'roulette.spinning': 'Girando...',
  'roulette.result': 'Saiu!',
  'roulette.winner': '{{name}} paga tudo!',
  'roulette.betterLuck': 'Sorte pra próxima 😂',

  // Common
  'common.error': 'Erro',
  'common.now': 'agora',
  'common.person': 'pessoa',
  'common.people': 'pessoas',

  // Tabs
  'tabs.home': 'Início',
  'tabs.groups': 'Grupos',
  'tabs.history': 'Histórico',
  'tabs.feed': 'Atividade',
  'tabs.profile': 'Perfil',

  // Auth - Phone Step
  'auth.welcome': 'Bem-vindo ao La Vaca 🐄',
  'auth.phoneSubtitle': 'Insira seu número de celular para começar',
  'auth.phoneLabel': 'Celular',
  'auth.phonePlaceholder': 'Ex: 3001234567',
  'auth.sendCode': 'Enviar código 📱',
  'auth.invalidPhone': 'Insira um número válido',
  'auth.errorSendingOTP': 'Não foi possível enviar o código',
  'auth.hint': 'Seu celular é sua identidade. Sem senhas, simples e fácil.',
  'auth.hintDev': '🔧 Modo dev: o código é mostrado na tela. Em produção será enviado por SMS.',
  'auth.selectCountry': 'Selecionar país',
  'auth.searchCountry': 'Buscar país...',

  // Auth - OTP Step
  'auth.verifyTitle': 'Verificar número 📱',
  'auth.verifySubtitle': 'Insira o código de 6 dígitos enviado para {{phone}}',
  'auth.verifyButton': 'Verificar',
  'auth.invalidOTP': 'Insira o código completo de 6 dígitos',
  'auth.errorVerifyingOTP': 'Código inválido ou expirado',
  'auth.changePhone': 'Mudar número',

  // Auth - Register Step
  'auth.registerTitle': 'Complete seu perfil 🐄',
  'auth.registerSubtitle': 'Número verificado: {{phone}}',
  'auth.nameLabel': 'Nome completo',
  'auth.namePlaceholder': 'Ex: João Silva',
  'auth.usernameLabel': 'Nome de usuário',
  'auth.usernamePlaceholder': 'Ex: joao.silva',
  'auth.documentLabel': 'Documento de identidade (obrigatório)',
  'auth.documentPlaceholder': 'Ex: 1234567890',
  'auth.registerButton': 'Criar conta 🐄',
  'auth.invalidUsername': 'O usuário deve ter pelo menos 3 caracteres',
  'auth.noName': 'Insira seu nome',
  'auth.noDocument': 'O documento de identidade é obrigatório',
  'auth.errorRegistering': 'Não foi possível registrar',

  // Feed
  'feed.empty': 'Nenhuma atividade ainda',
  'feed.emptyHint': 'Crie ou entre numa mesa para ver atividade aqui',

  // Profile
  'profile.name': 'Nome',
  'profile.username': 'Usuário',
  'profile.phone': 'Celular',
  'profile.document': 'Documento',
  'profile.memberSince': 'Membro desde',
  'profile.permissionNeeded': 'Permissão necessária para acessar suas fotos',
  'profile.logout': 'Sair',
  'profile.logoutTitle': 'Sair',
  'profile.logoutMessage': 'Tem certeza que quer sair?',
  'profile.logoutConfirm': 'Sair',
  'profile.cancel': 'Cancelar',

  // Groups
  'groups.empty': 'Nenhum grupo ainda',
  'groups.emptyHint': 'Crie um grupo com seus amigos para dividir contas mais rápido',
  'groups.members': 'membros',
  'groups.createTitle': 'Criar grupo',
  'groups.nameLabel': 'Nome do grupo',
  'groups.namePlaceholder': 'Ex: Os amigos',
  'groups.iconLabel': 'Ícone',
  'groups.createButton': 'Criar grupo 🐄',
  'groups.noName': 'Insira um nome para o grupo',
  'groups.deleteTitle': 'Excluir grupo',
  'groups.deleteMessage': 'Tem certeza que quer excluir "{{name}}"?',
  'groups.deleteConfirm': 'Excluir',
  'groups.addMembers': 'Adicionar membros',
  'groups.searchPlaceholder': 'Buscar por nome, usuário ou celular',
  'groups.searchHint': 'Digite pelo menos 2 caracteres',
  'groups.noResults': 'Nenhum usuário encontrado',
  'groups.alreadyMember': 'Já é membro',
  'groups.addButton': 'Adicionar',
  'groups.memberAdded': '{{name}} foi adicionado ao grupo',
  'groups.removeMember': 'Remover membro',
  'groups.removeMessage': 'Remover {{name}} do grupo?',
  'groups.removeConfirm': 'Remover',
  'groups.createSession': 'Criar mesa com este grupo',
  'groups.admin': 'Admin',
  'groups.noMembers': 'Nenhum membro ainda',
  'groups.groupNotFound': 'Grupo não encontrado',

  // History
  'history.empty': 'Nenhum histórico ainda',
  'history.emptyHint': 'Seu histórico de mesas e divisões aparecerá aqui',
  'history.untitled': 'Mesa sem nome',
  'history.myPart': 'Minha parte',
  'history.organizer': 'Organizador',
  'history.participant': 'Participante',
};

export const translations: Record<Locale, TranslationKeys> = { es, en, pt };
