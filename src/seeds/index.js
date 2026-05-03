// src/seeds/index.js — BrotoSmart v3
// 90 atividades em 3 trilhas, 5 níveis cada, alinhadas à BNCC.
//   Nível 1 → Educação Infantil  (4–5 anos)
//   Nível 2 → 1º/2º ano EF      (6–7 anos)
//   Nível 3 → 3º/4º ano EF      (8–9 anos)
//   Nível 4 → 5º/6º ano EF      (10–11 anos)
//   Nível 5 → 7º ano+            (12 anos)

const { getPrisma, connectDB, disconnectDB } = require('../config/database');

const TRACKS = [
  { name: 'Matemática',           slug: 'matematica',          icon: '🔢', color: '#3B82F6', description: 'Números, contas e formas geométricas' },
  { name: 'Português',            slug: 'portugues',           icon: '📚', color: '#8B5CF6', description: 'Letras, palavras e histórias' },
  { name: 'Conhecimentos Gerais', slug: 'conhecimentos-gerais', icon: '🌍', color: '#10B981', description: 'Ciências, história, geografia e curiosidades do mundo' },
  { name: 'Ciências',             slug: 'ciencias',            icon: '🔬', color: '#06B6D4', description: 'Animais, plantas, corpo humano e meio ambiente' },
  { name: 'Geografia do Brasil',  slug: 'geografia-brasil',    icon: '🗺️', color: '#F97316', description: 'Regiões, estados, biomas e cultura brasileira' },
];

const ACTIVITIES = {
  matematica: [
    // Nível 1
    { title:'Contagem até 5',     level:1, seedsReward:8,  question:'Quantas maçãs você vê? 🍎🍎🍎', options:['1','2','3','4'], correctIndex:2, explanation:'Vamos contar: 1... 2... 3! São 3 maçãs! 🎉' },
    { title:'Mais ou menos',      level:1, seedsReward:8,  question:'Qual grupo tem MAIS? 🐶🐶🐶 ou 🐱🐱?', options:['Os cachorros','Os gatos','São iguais','Não sei'], correctIndex:0, explanation:'3 cachorros é mais que 2 gatos!' },
    { title:'Formas geométricas', level:1, seedsReward:8,  question:'A bola tem a forma de um...?', options:['Triângulo','Quadrado','Círculo','Retângulo'], correctIndex:2, explanation:'A bola é redonda como um círculo! ⚽' },
    { title:'Número anterior',    level:1, seedsReward:8,  question:'Que número vem ANTES do 5?', options:['6','4','3','7'], correctIndex:1, explanation:'4 vem antes do 5! A ordem é: ...3, 4, 5...' },
    { title:'Contagem de dedos',  level:1, seedsReward:8,  question:'Levanto 2 dedos numa mão e 3 na outra. Quantos no total?', options:['4','5','6','3'], correctIndex:1, explanation:'2 + 3 = 5! ✋' },
    { title:'Número maior',       level:1, seedsReward:8,  question:'Qual número é MAIOR: 7 ou 4?', options:['4','São iguais','7','Não sei'], correctIndex:2, explanation:'7 é maior que 4!' },
    // Nível 2
    { title:'Soma simples',       level:2, seedsReward:10, question:'Quanto é 3 + 4?', options:['5','6','7','8'], correctIndex:2, explanation:'3 + 4 = 7!' },
    { title:'Subtração simples',  level:2, seedsReward:10, question:'Maria tinha 8 maçãs e comeu 3. Quantas sobraram?', options:['3','4','5','6'], correctIndex:2, explanation:'8 - 3 = 5. 🍎' },
    { title:'Dezenas',            level:2, seedsReward:10, question:'Qual número vem depois do 19?', options:['18','20','21','29'], correctIndex:1, explanation:'Depois do 19 vem o 20!' },
    { title:'Dobro',              level:2, seedsReward:10, question:'Qual é o dobro de 4?', options:['6','7','8','9'], correctIndex:2, explanation:'Dobro de 4 é 4 + 4 = 8!' },
    { title:'Metade',             level:2, seedsReward:10, question:'Pedro tem 10 balas e divide igualmente com o irmão. Cada um fica com...?', options:['4','5','6','8'], correctIndex:1, explanation:'Metade de 10 é 5! 10 ÷ 2 = 5.' },
    { title:'Horas cheias',       level:2, seedsReward:10, question:'O ponteiro grande está no 12 e o pequeno no 3. Que horas são?', options:['12h','3h','6h','9h'], correctIndex:1, explanation:'Ponteiro pequeno no 3 = 3 horas! ⏰' },
    // Nível 3
    { title:'Multiplicação',      level:3, seedsReward:15, question:'Quanto é 5 × 3?', options:['10','12','15','18'], correctIndex:2, explanation:'5 × 3 = 15! É como somar 5 três vezes.' },
    { title:'Divisão',            level:3, seedsReward:15, question:'João quer dividir 12 balas entre 4 amigos. Cada um recebe...?', options:['2','3','4','6'], correctIndex:1, explanation:'12 ÷ 4 = 3. 🍬' },
    { title:'Hexágono',           level:3, seedsReward:15, question:'Quantos lados tem um hexágono?', options:['4','5','6','8'], correctIndex:2, explanation:'Hexa = 6! As colmeias têm formato hexagonal! 🐝' },
    { title:'Fração metade',      level:3, seedsReward:15, question:'Uma pizza foi cortada em 8 pedaços. Se comer 4, comeu...?', options:['1/4','1/3','1/2','2/3'], correctIndex:2, explanation:'4/8 = 1/2! Você comeu metade da pizza. 🍕' },
    { title:'Tabuada do 6',       level:3, seedsReward:15, question:'Quanto é 6 × 7?', options:['36','42','48','54'], correctIndex:1, explanation:'6 × 7 = 42!' },
    { title:'Perímetro',          level:3, seedsReward:15, question:'Um quadrado tem lados de 5cm. Qual é o seu perímetro?', options:['15cm','20cm','25cm','30cm'], correctIndex:1, explanation:'Perímetro = 4 × 5cm = 20cm! 📐' },
    // Nível 4
    { title:'Porcentagem',        level:4, seedsReward:20, question:'Um tênis custa R$200 com 25% de desconto. Qual o valor do desconto?', options:['R$25','R$40','R$50','R$75'], correctIndex:2, explanation:'25% de 200 = R$50! 🛍️' },
    { title:'Área do retângulo',  level:4, seedsReward:20, question:'Um quarto mede 4m × 5m. Qual é a área?', options:['18m²','20m²','22m²','25m²'], correctIndex:1, explanation:'Área = 4 × 5 = 20m²! 📏' },
    { title:'Números negativos',  level:4, seedsReward:20, question:'A temperatura estava em -3°C e subiu 8°C. Qual a temperatura agora?', options:['3°C','4°C','5°C','6°C'], correctIndex:2, explanation:'-3 + 8 = 5°C! 🌡️' },
    { title:'Equação simples',    level:4, seedsReward:20, question:'Se 2x + 4 = 14, qual é o valor de x?', options:['4','5','6','7'], correctIndex:1, explanation:'2x = 10 → x = 5!' },
    { title:'MMC',                level:4, seedsReward:20, question:'Qual é o MMC de 4 e 6?', options:['8','12','16','24'], correctIndex:1, explanation:'Primeiro múltiplo em comum de 4 e 6 é 12!' },
    { title:'Razão e proporção',  level:4, seedsReward:20, question:'Se 3 canetas custam R$9, quanto custam 7 canetas?', options:['R$18','R$20','R$21','R$24'], correctIndex:2, explanation:'Cada caneta = R$3. 7 × R$3 = R$21!' },
    // Nível 5
    { title:'Potenciação',        level:5, seedsReward:25, question:'Quanto é 2⁵?', options:['10','16','32','64'], correctIndex:2, explanation:'2⁵ = 2×2×2×2×2 = 32!' },
    { title:'Álgebra',            level:5, seedsReward:25, question:'Simplifique: 3a + 2b - a + 4b', options:['2a + 6b','4a + 6b','2a + 2b','4a + 2b'], correctIndex:0, explanation:'3a-a=2a e 2b+4b=6b → 2a+6b!' },
    { title:'Área do círculo',    level:5, seedsReward:25, question:'Círculo com raio 5cm. Qual é sua área? (π≈3,14)', options:['31,4cm²','62,8cm²','78,5cm²','94,2cm²'], correctIndex:2, explanation:'A = π×r² = 3,14×25 = 78,5cm²! ⭕' },
    { title:'Pitágoras',          level:5, seedsReward:25, question:'Triângulo retângulo com catetos 3cm e 4cm. Qual é a hipotenusa?', options:['5cm','6cm','7cm','8cm'], correctIndex:0, explanation:'a²+b²=c² → 9+16=25 → c=5cm! 📐' },
    { title:'Equação 2º grau',    level:5, seedsReward:25, question:'Raízes de x² - 5x + 6 = 0?', options:['x=1 e x=6','x=2 e x=3','x=-2 e x=-3','x=3 e x=4'], correctIndex:1, explanation:'(x-2)(x-3)=0 → x=2 ou x=3!' },
    { title:'Progressão',         level:5, seedsReward:25, question:'Qual é o próximo número da sequência: 2, 4, 8, 16, ...?', options:['18','24','32','64'], correctIndex:2, explanation:'Cada número dobra o anterior! 16 × 2 = 32. É uma P.G. de razão 2.' },
  ],

  portugues: [
    // Nível 1
    { title:'Letra inicial',      level:1, seedsReward:8,  question:'Com qual letra começa a palavra BOLA?', options:['A','B','C','D'], correctIndex:1, explanation:'BOLA começa com B! B de borboleta. 🦋' },
    { title:'Vogais',             level:1, seedsReward:8,  question:'Qual destas é uma vogal?', options:['B','C','E','F'], correctIndex:2, explanation:'As vogais são: A, E, I, O, U. O E é vogal!' },
    { title:'Rima',               level:1, seedsReward:8,  question:'Qual palavra rima com GATO?', options:['Casa','Pato','Bola','Pipa'], correctIndex:1, explanation:'GATO e PATO rimam! Mesmo som: -ATO. 🐱🦆' },
    { title:'Letras do nome',     level:1, seedsReward:8,  question:'Quantas letras tem a palavra SOL?', options:['2','3','4','5'], correctIndex:1, explanation:'S-O-L: 3 letras! ☀️' },
    { title:'Começa igual',       level:1, seedsReward:8,  question:'Qual palavra começa com o mesmo som de MACACO?', options:['Borboleta','Maçã','Tigre','Pato'], correctIndex:1, explanation:'MACACO e MAÇÃ começam com MA! 🐒🍎' },
    { title:'Final igual',        level:1, seedsReward:8,  question:'Qual palavra termina igual a AMOR?', options:['Casa','Flor','Calor','Bola'], correctIndex:2, explanation:'AMOR e CALOR terminam com -OR! 🌡️' },
    // Nível 2
    { title:'Sílabas',            level:2, seedsReward:10, question:'Quantas sílabas tem BORBOLETA?', options:['2','3','4','5'], correctIndex:2, explanation:'BOR-BO-LE-TA: 4 sílabas! 👏' },
    { title:'Plural simples',     level:2, seedsReward:10, question:'Qual é o plural de FLOR?', options:['Flors','Flores','Floris','Flos'], correctIndex:1, explanation:'O plural de FLOR é FLORES! 🌸' },
    { title:'Artigo',             level:2, seedsReward:10, question:'Qual artigo usamos antes de CADERNO?', options:['A','O','AS','OS'], correctIndex:1, explanation:'Caderno é masculino → O caderno! 📓' },
    { title:'Ordem alfabética',   level:2, seedsReward:10, question:'Qual letra vem DEPOIS do M no alfabeto?', options:['L','K','N','O'], correctIndex:2, explanation:'...L, M, N, O... O N vem depois do M!' },
    { title:'Pontuação',          level:2, seedsReward:10, question:'Usamos o ponto de interrogação (?) quando...?', options:['Terminamos uma frase','Fazemos uma pergunta','Estamos animados','Fazemos uma lista'], correctIndex:1, explanation:'O ? aparece no final de perguntas! ❓' },
    { title:'Letra maiúscula',    level:2, seedsReward:10, question:'Em qual caso DEVEMOS usar letra maiúscula?', options:['No meio da frase','No início do nome de uma pessoa','Antes de vírgula','No final da frase'], correctIndex:1, explanation:'Nomes próprios sempre começam com maiúscula!' },
    // Nível 3
    { title:'Sinônimos',          level:3, seedsReward:15, question:'Qual palavra tem significado parecido com FELIZ?', options:['Triste','Alegre','Bravo','Cansado'], correctIndex:1, explanation:'FELIZ e ALEGRE são sinônimos! 😊' },
    { title:'Antônimos',          level:3, seedsReward:15, question:'Qual é o antônimo (oposto) de QUENTE?', options:['Morno','Gelado','Frio','Fresco'], correctIndex:2, explanation:'QUENTE e FRIO são antônimos! 🌡️' },
    { title:'Adjetivo',           level:3, seedsReward:15, question:'Em "A menina INTELIGENTE resolveu o problema", a palavra destacada é um...?', options:['Substantivo','Verbo','Adjetivo','Advérbio'], correctIndex:2, explanation:'INTELIGENTE é adjetivo — descreve a menina! 🌟' },
    { title:'Masculino-feminino', level:3, seedsReward:15, question:'Qual é o feminino de LEÃO?', options:['Leãoa','Leã','Leoa','Leõa'], correctIndex:2, explanation:'O feminino de LEÃO é LEOA! 🦁' },
    { title:'Verbo',              level:3, seedsReward:15, question:'Qual palavra é um VERBO (ação)?', options:['Rápido','Correr','Alto','Flor'], correctIndex:1, explanation:'CORRER é um verbo — indica uma ação! 🏃' },
    { title:'Separação silábica', level:3, seedsReward:15, question:'Como se separam as sílabas de MARIPOSA?', options:['Ma-ri-po-sa','Mar-ip-os-a','Ma-rip-osa','Mari-posa'], correctIndex:0, explanation:'MA-RI-PO-SA! Cada sílaba tem uma vogal. 🦋' },
    // Nível 4
    { title:'Concordância verbal', level:4, seedsReward:20, question:'Qual frase está correta?', options:['Os meninos foi ao parque.','Os meninos foram ao parque.','Os menino foram ao parque.','Os menino foi ao parque.'], correctIndex:1, explanation:'"Os meninos FORAM" — verbo concorda com sujeito plural! 📝' },
    { title:'Metáfora',           level:4, seedsReward:20, question:'Em "Ela tem um coração de ouro", o que significa?', options:['Coração feito de ouro','Ela é bondosa','Ela é rica','Ela é fria'], correctIndex:1, explanation:'"Coração de ouro" é metáfora — significa bondade! 💛' },
    { title:'Pronomes',           level:4, seedsReward:20, question:'Qual pronome substitui "Pedro e Maria"?', options:['Ele','Ela','Eles','Nós'], correctIndex:2, explanation:'Pedro e Maria = ELES! Mais de uma pessoa → plural. 👥' },
    { title:'Crase',              level:4, seedsReward:20, question:'Qual frase usa a crase corretamente?', options:['Vou à escola.','Vou á escola.','Vou a escola.','Vou às escola.'], correctIndex:0, explanation:'"Vou À escola" — crase = a (preposição) + a (artigo)! 🏫' },
    { title:'Sujeito inexistente', level:4, seedsReward:20, question:'Na frase "Choveu muito ontem", o sujeito é...?', options:['Choveu','Muito','Ontem','A frase não tem sujeito'], correctIndex:3, explanation:'Verbos de fenômenos da natureza não têm sujeito! 🌧️' },
    { title:'Conjunções',         level:4, seedsReward:20, question:'Qual conjunção indica CONTRASTE entre duas ideias?', options:['E','Mas','Porque','Então'], correctIndex:1, explanation:'MAS indica contraste! Ex: "Estudei, MAS fiquei nervoso." 📚' },
    // Nível 5
    { title:'Predicado verbal',   level:5, seedsReward:25, question:'Na frase "Ana comprou livros novos", qual é o predicado?', options:['Ana','comprou livros novos','livros novos','novos'], correctIndex:1, explanation:'"Comprou livros novos" é o predicado! 📖' },
    { title:'Ironia',             level:5, seedsReward:25, question:'Quando alguém diz "Que ótimo!" após algo ruim, está usando...?', options:['Metáfora','Comparação','Ironia','Hipérbole'], correctIndex:2, explanation:'Ironia é dizer o contrário do que se pensa! 😏' },
    { title:'Período composto',   level:5, seedsReward:25, question:'Quantas orações tem: "Quando cheguei, ela já havia saído"?', options:['1','2','3','4'], correctIndex:1, explanation:'São 2 orações! Período composto tem 2+ verbos. 📝' },
    { title:'Voz passiva',        level:5, seedsReward:25, question:'Passe para voz passiva: "O gato comeu o rato"', options:['O rato foi comido pelo gato.','O gato foi comido pelo rato.','O rato comeu o gato.','Ambos comeram.'], correctIndex:0, explanation:'"O rato FOI COMIDO PELO gato." — objeto vira sujeito paciente! 🐱' },
    { title:'Hipérbole',          level:5, seedsReward:25, question:'"Mil pessoas me ligaram hoje!" é um exemplo de...?', options:['Metáfora','Hipérbole','Eufemismo','Personificação'], correctIndex:1, explanation:'Hipérbole é exagero intencional! 📞' },
    { title:'Narrador',           level:5, seedsReward:25, question:'Quando o narrador conta a história usando "eu", é chamado de narrador...?', options:['Onisciente','Observador','Protagonista','Testemunha'], correctIndex:2, explanation:'Narrador-protagonista: participa da história e usa a 1ª pessoa (eu)! ✍️' },
  ],

  'conhecimentos-gerais': [
    // ── Nível 1: Educação Infantil (4–5 anos) ──────────────────────────────────
    // Mundo ao redor, animais, cores, natureza
    {
      title: 'Onde vivem os peixes?', level: 1, seedsReward: 8,
      question: 'Onde os peixes vivem?',
      options: ['Na terra', 'Na água', 'No céu', 'Nas árvores'],
      correctIndex: 1,
      explanation: 'Os peixes vivem na água — no mar, nos rios e nos lagos! 🐟💧',
    },
    {
      title: 'Sol e lua', level: 1, seedsReward: 8,
      question: 'Quando o sol aparece no céu?',
      options: ['À noite', 'De dia', 'Debaixo da chuva', 'Nunca'],
      correctIndex: 1,
      explanation: 'O sol aparece de dia e nos dá luz e calor! À noite aparece a lua. ☀️🌙',
    },
    {
      title: 'Animal da fazenda', level: 1, seedsReward: 8,
      question: 'Qual animal nos dá leite?',
      options: ['Leão', 'Vaca', 'Peixe', 'Borboleta'],
      correctIndex: 1,
      explanation: 'A vaca nos dá leite! Com o leite fazemos queijo, iogurte e manteiga. 🐄🥛',
    },
    {
      title: 'Cores do arco-íris', level: 1, seedsReward: 8,
      question: 'Qual cor aparece no arco-íris?',
      options: ['Preto', 'Rosa', 'Vermelho', 'Dourado'],
      correctIndex: 2,
      explanation: 'O arco-íris tem 7 cores: vermelho, laranja, amarelo, verde, azul, anil e violeta! 🌈',
    },
    {
      title: 'Estações do ano', level: 1, seedsReward: 8,
      question: 'Em qual estação as folhas caem das árvores?',
      options: ['Verão', 'Primavera', 'Outono', 'Inverno'],
      correctIndex: 2,
      explanation: 'No outono as folhas mudam de cor e caem! As 4 estações são: verão, outono, inverno e primavera. 🍂',
    },
    {
      title: 'Partes do corpo', level: 1, seedsReward: 8,
      question: 'Com qual parte do corpo a gente ouve os sons?',
      options: ['Olhos', 'Nariz', 'Boca', 'Orelhas'],
      correctIndex: 3,
      explanation: 'Ouvimos com as orelhas! Os olhos enxergam, o nariz cheira e a boca fala e come. 👂',
    },

    // ── Nível 2: 1º/2º ano (6–7 anos) ─────────────────────────────────────────
    // Brasil, natureza, corpo humano, curiosidades simples
    {
      title: 'Capital do Brasil', level: 2, seedsReward: 10,
      question: 'Qual é a capital do Brasil?',
      options: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador'],
      correctIndex: 2,
      explanation: 'A capital do Brasil é Brasília! Ela foi construída e inaugurada em 1960. 🏛️',
    },
    {
      title: 'Bandeira do Brasil', level: 2, seedsReward: 10,
      question: 'Quais são as cores da bandeira do Brasil?',
      options: ['Azul e branco', 'Amarelo, verde e azul', 'Vermelho e verde', 'Branco e vermelho'],
      correctIndex: 1,
      explanation: 'A bandeira do Brasil tem verde, amarelo e azul! O losango amarelo representa a riqueza e o retângulo azul o céu. 🇧🇷',
    },
    {
      title: 'Planeta Terra', level: 2, seedsReward: 10,
      question: 'Como se chama o planeta onde vivemos?',
      options: ['Marte', 'Vênus', 'Terra', 'Júpiter'],
      correctIndex: 2,
      explanation: 'Vivemos no planeta Terra! É o único planeta com vida conhecida. 🌍',
    },
    {
      title: 'Fotossíntese simples', level: 2, seedsReward: 10,
      question: 'O que as plantas usam para fazer seu alimento?',
      options: ['Chuva e terra', 'Sol e água', 'Vento e fogo', 'Neve e ar'],
      correctIndex: 1,
      explanation: 'As plantas usam a luz do sol e a água para fazer seu alimento — esse processo se chama fotossíntese! 🌿☀️',
    },
    {
      title: 'Reciclagem', level: 2, seedsReward: 10,
      question: 'Por que devemos separar o lixo para reciclagem?',
      options: ['Para ocupar mais espaço', 'Para proteger o meio ambiente', 'Porque é obrigatório por lei', 'Para jogar mais lixo fora'],
      correctIndex: 1,
      explanation: 'Reciclar protege o meio ambiente! Reduzimos o lixo, economizamos energia e preservamos a natureza. ♻️🌱',
    },
    {
      title: 'Continentes', level: 2, seedsReward: 10,
      question: 'Em qual continente fica o Brasil?',
      options: ['Europa', 'África', 'América do Sul', 'Oceania'],
      correctIndex: 2,
      explanation: 'O Brasil fica na América do Sul! É o maior país da América do Sul. 🗺️',
    },

    // ── Nível 3: 3º/4º ano (8–9 anos) ─────────────────────────────────────────
    // História do Brasil, sistema solar, ciências, geografia
    {
      title: 'Independência do Brasil', level: 3, seedsReward: 15,
      question: 'Em que ano o Brasil declarou sua independência de Portugal?',
      options: ['1500', '1822', '1889', '1964'],
      correctIndex: 1,
      explanation: 'O Brasil se tornou independente em 7 de setembro de 1822! Dom Pedro I proclamou a independência às margens do Rio Ipiranga. 🇧🇷',
    },
    {
      title: 'Sistema solar', level: 3, seedsReward: 15,
      question: 'Qual é o maior planeta do sistema solar?',
      options: ['Saturno', 'Netuno', 'Júpiter', 'Urano'],
      correctIndex: 2,
      explanation: 'Júpiter é o maior planeta do sistema solar! Ele é tão grande que caberia mais de 1.300 Terras dentro dele. 🪐',
    },
    {
      title: 'Amazônia', level: 3, seedsReward: 15,
      question: 'A Floresta Amazônica é importante porque...?',
      options: ['Tem muitos animais exóticos', 'Regula o clima e produz oxigênio', 'É bonita para turismo', 'Tem muita madeira'],
      correctIndex: 1,
      explanation: 'A Amazônia é o "pulmão do mundo"! Produz oxigênio, regula o clima e abriga milhões de espécies. 🌳🫁',
    },
    {
      title: 'Estados brasileiros', level: 3, seedsReward: 15,
      question: 'Quantos estados tem o Brasil?',
      options: ['24', '25', '26', '27'],
      correctIndex: 2,
      explanation: 'O Brasil tem 26 estados mais o Distrito Federal, totalizando 27 unidades federativas! 🗺️',
    },
    {
      title: 'Cadeia alimentar', level: 3, seedsReward: 15,
      question: 'Na cadeia alimentar, quem são os produtores?',
      options: ['Os animais carnívoros', 'Os fungos e bactérias', 'As plantas', 'Os herbívoros'],
      correctIndex: 2,
      explanation: 'As plantas são os produtores! Elas produzem seu próprio alimento pela fotossíntese e alimentam os demais seres. 🌿',
    },
    {
      title: 'Água potável', level: 3, seedsReward: 15,
      question: 'Qual porcentagem da água da Terra é doce e disponível para consumo?',
      options: ['50%', '25%', '10%', 'Menos de 3%'],
      correctIndex: 3,
      explanation: 'Apenas menos de 3% da água da Terra é doce, e grande parte está em geleiras! Por isso devemos economizar água. 💧',
    },

    // ── Nível 4: 5º/6º ano (10–11 anos) ───────────────────────────────────────
    // História mundial, ciências avançadas, geografia global
    {
      title: 'Revolução Industrial', level: 4, seedsReward: 20,
      question: 'Em qual país começou a Revolução Industrial no século XVIII?',
      options: ['França', 'Alemanha', 'Inglaterra', 'Estados Unidos'],
      correctIndex: 2,
      explanation: 'A Revolução Industrial começou na Inglaterra! Com o surgimento das máquinas a vapor, a produção industrial se transformou. ⚙️',
    },
    {
      title: 'Sistema digestório', level: 4, seedsReward: 20,
      question: 'Qual é o órgão responsável por absorver a maioria dos nutrientes dos alimentos?',
      options: ['Estômago', 'Intestino delgado', 'Intestino grosso', 'Fígado'],
      correctIndex: 1,
      explanation: 'O intestino delgado absorve a maioria dos nutrientes! Ele mede cerca de 6 a 7 metros de comprimento. 🫀',
    },
    {
      title: 'Camadas da Terra', level: 4, seedsReward: 20,
      question: 'Qual é a camada mais externa da Terra?',
      options: ['Manto', 'Núcleo interno', 'Crosta terrestre', 'Núcleo externo'],
      correctIndex: 2,
      explanation: 'A crosta terrestre é a camada mais externa! É onde vivemos. As camadas são: crosta, manto e núcleo. 🌋',
    },
    {
      title: 'Direitos humanos', level: 4, seedsReward: 20,
      question: 'A Declaração Universal dos Direitos Humanos foi adotada pela ONU em qual ano?',
      options: ['1945', '1948', '1960', '1975'],
      correctIndex: 1,
      explanation: 'A Declaração Universal dos Direitos Humanos foi adotada em 1948! Garante direitos fundamentais a todos os seres humanos. 🕊️',
    },
    {
      title: 'Energia renovável', level: 4, seedsReward: 20,
      question: 'Qual destas é uma fonte de energia NÃO renovável?',
      options: ['Energia solar', 'Energia eólica', 'Petróleo', 'Energia hidrelétrica'],
      correctIndex: 2,
      explanation: 'O petróleo é uma fonte não renovável — demora milhões de anos para se formar! Já sol, vento e água se renovam naturalmente. ⛽',
    },
    {
      title: 'Biomas brasileiros', level: 4, seedsReward: 20,
      question: 'Qual é o bioma característico do sertão nordestino, com plantas resistentes à seca?',
      options: ['Cerrado', 'Caatinga', 'Pantanal', 'Mata Atlântica'],
      correctIndex: 1,
      explanation: 'A Caatinga cobre o sertão nordestino! É o único bioma 100% brasileiro, com plantas como mandacaru e umbuzeiro. 🌵',
    },

    // ── Nível 5: 7º ano+ (12 anos) ─────────────────────────────────────────────
    // Política, filosofia, ciências avançadas, atualidades
    {
      title: 'Democracia', level: 5, seedsReward: 25,
      question: 'O que caracteriza um sistema democrático?',
      options: ['Poder concentrado em uma pessoa', 'O poder emana do povo por meio de eleições', 'Governo controlado pelo exército', 'Decisões tomadas pela família real'],
      correctIndex: 1,
      explanation: 'Na democracia, o poder vem do povo! Os cidadãos elegem seus representantes por meio de eleições livres. 🗳️',
    },
    {
      title: 'Célula', level: 5, seedsReward: 25,
      question: 'Qual estrutura da célula é responsável pela produção de energia (ATP)?',
      options: ['Núcleo', 'Ribossomo', 'Mitocôndria', 'Retículo endoplasmático'],
      correctIndex: 2,
      explanation: 'A mitocôndria é a "usina de energia" da célula! Ela produz ATP por meio da respiração celular. ⚡🔬',
    },
    {
      title: 'Iluminismo', level: 5, seedsReward: 25,
      question: 'Qual movimento intelectual do século XVIII influenciou a Revolução Francesa e a Independência americana?',
      options: ['Renascimento', 'Romantismo', 'Iluminismo', 'Barroco'],
      correctIndex: 2,
      explanation: 'O Iluminismo defendia razão, liberdade e igualdade! Suas ideias inspiraram revoluções que moldaram o mundo moderno. 💡',
    },
    {
      title: 'Aquecimento global', level: 5, seedsReward: 25,
      question: 'Qual gás é o principal responsável pelo efeito estufa e aquecimento global?',
      options: ['Oxigênio (O₂)', 'Nitrogênio (N₂)', 'Dióxido de carbono (CO₂)', 'Hidrogênio (H₂)'],
      correctIndex: 2,
      explanation: 'O CO₂ (dióxido de carbono) é o principal gás do efeito estufa! A queima de combustíveis fósseis aumentou sua concentração na atmosfera. 🌡️🌍',
    },
    {
      title: 'Constituição brasileira', level: 5, seedsReward: 25,
      question: 'Em que ano foi promulgada a atual Constituição Federal do Brasil, chamada de "Constituição Cidadã"?',
      options: ['1946', '1964', '1985', '1988'],
      correctIndex: 3,
      explanation: 'A Constituição de 1988 foi promulgada após o fim da ditadura militar! Ficou conhecida como "Constituição Cidadã" por garantir amplos direitos aos brasileiros. 📜',
    },
    {
      title: 'Relatividade', level: 5, seedsReward: 25,
      question: 'Quem formulou a Teoria da Relatividade, que revolucionou a física no século XX?',
      options: ['Isaac Newton', 'Galileu Galilei', 'Albert Einstein', 'Stephen Hawking'],
      correctIndex: 2,
      explanation: 'Albert Einstein formulou a Teoria da Relatividade em 1905 e 1915! Ela revelou que espaço e tempo são relativos e que E=mc². 🧠⚛️',
    },
  ],
};

  ciencias: [
    // Nível 1 — Educação Infantil (4–5 anos)
    { title:'Animais domésticos',   level:1, seedsReward:8,  question:'Qual destes é um animal doméstico?', options:['Leão','Cachorro','Tubarão','Lobo'], correctIndex:1, explanation:'O cachorro vive com as pessoas! Leão, tubarão e lobo vivem na natureza. 🐶' },
    { title:'Partes das plantas',   level:1, seedsReward:8,  question:'O que a planta usa para beber água do solo?', options:['Folhas','Flores','Raízes','Galhos'], correctIndex:2, explanation:'As raízes absorvem água e nutrientes do solo para a planta! 🌱' },
    { title:'Dia e noite',          level:1, seedsReward:8,  question:'Por que existe o dia e a noite?', options:['Por causa da chuva','Porque a Terra gira','Por causa do vento','Porque o sol some'], correctIndex:1, explanation:'A Terra gira e quando seu lado está voltado pro sol, é dia! Do outro lado, é noite. 🌍' },
    { title:'Sentidos do corpo',    level:1, seedsReward:8,  question:'Qual sentido usamos para ouvir música?', options:['Visão','Olfato','Audição','Tato'], correctIndex:2, explanation:'A audição! Nossos ouvidos captam os sons ao redor. 👂🎵' },
    { title:'Estados da água',      level:1, seedsReward:8,  question:'O que acontece com a água quando congela?', options:['Vira nuvem','Vira gelo','Vira vapor','Some'], correctIndex:1, explanation:'Quando a água fica muito fria, vira gelo (estado sólido)! 🧊' },
    { title:'Alimentação saudável', level:1, seedsReward:8,  question:'Qual alimento deixa nossos ossos mais fortes?', options:['Sorvete','Suco de caixa','Leite','Refrigerante'], correctIndex:2, explanation:'O leite tem cálcio, que fortalece ossos e dentes! 🥛🦷' },
    // Nível 2 — 1º/2º ano (6–7 anos)
    { title:'Cadeia alimentar',     level:2, seedsReward:10, question:'O que os herbívoros comem?', options:['Outros animais','Plantas e vegetais','Insetos','Pedras'], correctIndex:1, explanation:'Herbívoros comem apenas plantas! Como vacas, coelhos e girafas. 🌿🐄' },
    { title:'Ciclo da água',        level:2, seedsReward:10, question:'Como a água dos rios vai parar nas nuvens?', options:['O vento carrega','Ela evapora com o calor do sol','Os peixes a levam','Ela sobe pelos galhos'], correctIndex:1, explanation:'O sol aquece a água, que vira vapor e sobe formando nuvens. É a evaporação! ☀️💧' },
    { title:'Respiração',           level:2, seedsReward:10, question:'Que gás os seres humanos precisam para respirar?', options:['Dióxido de carbono','Nitrogênio','Oxigênio','Hidrogênio'], correctIndex:2, explanation:'Respiramos oxigênio (O₂)! As plantas nos ajudam produzindo oxigênio pela fotossíntese. 🌿🫁' },
    { title:'Vertebrados',          level:2, seedsReward:10, question:'O que é um animal vertebrado?', options:['Tem asas','Tem espinha dorsal','Vive na água','Tem pelo'], correctIndex:1, explanation:'Vertebrados têm coluna vertebral (espinha)! Peixes, pássaros, répteis, anfíbios e mamíferos são vertebrados. 🦴' },
    { title:'Sistema solar basico', level:2, seedsReward:10, question:'Qual planeta fica mais perto do Sol?', options:['Venus','Terra','Mercúrio','Marte'], correctIndex:2, explanation:'Mercúrio é o planeta mais próximo do Sol! Por isso é muito quente durante o dia. ☀️🪐' },
    { title:'Materiais e estados',  level:2, seedsReward:10, question:'O que torna o ferro um sólido?', options:['Tem cheiro','Tem forma e volume próprios','É pesado','É brilhante'], correctIndex:1, explanation:'Sólidos têm forma e volume próprios — mantêm sua forma sem precisar de um recipiente. 🔩' },
    // Nível 3 — 3º/4º ano (8–9 anos)
    { title:'Fotossíntese',         level:3, seedsReward:15, question:'Qual substância as plantas produzem na fotossíntese além de oxigênio?', options:['Água','Glicose','Proteína','Vitamina C'], correctIndex:1, explanation:'Na fotossíntese as plantas usam luz solar, água e CO₂ para produzir glicose (açúcar) e oxigênio! 🌿⚡' },
    { title:'Ecossistemas',         level:3, seedsReward:15, question:'O que é um ecossistema?', options:['Só os animais de um lugar','O conjunto de seres vivos e o ambiente onde vivem','Apenas as plantas de uma floresta','O clima de uma região'], correctIndex:1, explanation:'Ecossistema = todos os seres vivos (fauna e flora) mais o ambiente físico (solo, água, ar). 🌍🌿🐾' },
    { title:'Digestão',             level:3, seedsReward:15, question:'Onde começa a digestão dos alimentos?', options:['Estômago','Intestino','Boca','Esôfago'], correctIndex:2, explanation:'A digestão começa na boca! Os dentes trituram o alimento e a saliva inicia a quebra dos carboidratos. 😁' },
    { title:'Rochas e minerais',    level:3, seedsReward:15, question:'Como se formam as rochas magmáticas (ou ígneas)?', options:['Pela erosão do vento','Pelo resfriamento do magma','Pela pressão de sedimentos','Pela decomposição de animais'], correctIndex:1, explanation:'Rochas ígneas formam quando o magma (rocha derretida) esfria e endurece. O granito é um exemplo! 🌋🪨' },
    { title:'Força e movimento',    level:3, seedsReward:15, question:'O que é a gravidade?', options:['Uma força que repele objetos','A força que atrai objetos em direção à Terra','O peso de um objeto','A velocidade de queda'], correctIndex:1, explanation:'A gravidade é a força de atração que a Terra exerce sobre os objetos — é por isso que tudo cai! 🍎⬇️' },
    { title:'Células básico',       level:3, seedsReward:15, question:'Qual é a menor unidade viva de todos os seres vivos?', options:['Átomo','Molécula','Célula','Tecido'], correctIndex:2, explanation:'A célula é a menor unidade funcional da vida! Somos feitos de bilhões de células. 🔬' },
    // Nível 4 — 5º/6º ano (10–11 anos)
    { title:'Herança genética',     level:4, seedsReward:20, question:'Onde fica guardada a informação genética (DNA) na célula?', options:['Mitocôndria','Ribossomo','Núcleo','Membrana'], correctIndex:2, explanation:'O DNA fica no núcleo da célula! Ele carrega todas as instruções para o funcionamento do organismo. 🧬' },
    { title:'Energia renovável',    level:4, seedsReward:20, question:'Qual fonte de energia usa o movimento do vento?', options:['Solar','Eólica','Hidrelétrica','Nuclear'], correctIndex:1, explanation:'Energia eólica = vento! As turbinas eólicas convertem o movimento do ar em eletricidade. 💨⚡' },
    { title:'Sistema nervoso',      level:4, seedsReward:20, question:'Qual órgão coordena todas as funções do corpo humano?', options:['Coração','Fígado','Pulmão','Cérebro'], correctIndex:3, explanation:'O cérebro é o "computador central" do corpo! Controla movimentos, pensamentos, emoções e funções vitais. 🧠' },
    { title:'Matéria e energia',    level:4, seedsReward:20, question:'Lei da conservação da energia: a energia pode ser...?', options:['Criada do nada','Destruída completamente','Transformada de uma forma em outra','Multiplicada indefinidamente'], correctIndex:2, explanation:'A energia não se cria nem se destrói — apenas se transforma! Ex: energia química vira calor ao queimar lenha. 🔥⚡' },
    { title:'Ecologia avancada',    level:4, seedsReward:20, question:'O que são espécies endêmicas?', options:['Espécies extintas','Espécies que só existem em uma determinada região','Espécies invasoras','Espécies migratórias'], correctIndex:1, explanation:'Endêmica = exclusiva de um lugar. O mico-leão-dourado é endêmico da Mata Atlântica! 🦁🌿' },
    { title:'Luz e óptica',         level:4, seedsReward:20, question:'Por que o céu é azul durante o dia?', options:['O ar é azul','O sol emite luz azul','A atmosfera dispersa mais a luz azul','O oceano reflete no céu'], correctIndex:2, explanation:'A atmosfera espalha a luz solar, mas dispersa mais a luz azul (menor comprimento de onda). Por isso vemos o céu azul! 🌤️' },
    // Nível 5 — 7º ano+ (12 anos)
    { title:'Evolução',             level:5, seedsReward:25, question:'Qual cientista formulou a Teoria da Evolução por seleção natural?', options:['Gregor Mendel','Louis Pasteur','Charles Darwin','Isaac Newton'], correctIndex:2, explanation:'Charles Darwin publicou "A Origem das Espécies" em 1859! A teoria explica como as espécies se adaptam e evoluem ao longo do tempo. 🐒🔬' },
    { title:'Genética mendeliana',  level:5, seedsReward:25, question:'Se pai tem olhos castanhos (dominante) e mãe tem olhos azuis (recessivo), o que predomina nos filhos?', options:['Olhos azuis','Olhos castanhos','Metade de cada','Olhos verdes'], correctIndex:1, explanation:'O gene dominante (castanho) se expressa mesmo com apenas uma cópia. O azul só aparece com duas cópias do gene recessivo. 👁️🧬' },
    { title:'Ligações químicas',    level:5, seedsReward:25, question:'O que é uma ligação covalente?', options:['Troca de elétrons entre átomos','Compartilhamento de pares de elétrons','Atração entre íons','Ligação de hidrogênio'], correctIndex:1, explanation:'Ligação covalente = compartilhamento de elétrons! Como na molécula de água (H₂O), onde oxigênio e hidrogênio compartilham elétrons. ⚛️' },
    { title:'Ecologia profunda',    level:5, seedsReward:25, question:'O que é biodiversidade?', options:['Número de animais de uma espécie','Variedade de formas de vida (espécies, genes, ecossistemas)','Quantidade de plantas de uma floresta','Número de ecossistemas do planeta'], correctIndex:1, explanation:'Biodiversidade é a variedade total de vida: espécies, variação genética dentro das espécies, e diversidade de ecossistemas. 🌍🌿🐾' },
    { title:'Física moderna',       level:5, seedsReward:25, question:'O que é um átomo?', options:['A menor partícula de qualquer coisa','A unidade básica da matéria, composta de prótons, nêutrons e elétrons','Uma molécula muito pequena','Um tipo de energia'], correctIndex:1, explanation:'O átomo é composto por um núcleo (prótons + nêutrons) e elétrons ao redor. É o tijolo fundamental da matéria! ⚛️' },
    { title:'Ecossistemas ameacados', level:5, seedsReward:25, question:'A Mata Atlântica já perdeu aproximadamente qual percentual de sua cobertura original?', options:['20%','45%','75%','88%'], correctIndex:3, explanation:'A Mata Atlântica perdeu cerca de 88% de sua área original! Hoje é considerado um dos biomas mais ameaçados do planeta (hotspot de biodiversidade). 🌿⚠️' },
  ],

  'geografia-brasil': [
    // Nível 1 — Educação Infantil (4–5 anos)
    { title:'Minha cidade',         level:1, seedsReward:8,  question:'Como se chama o lugar onde moramos com outras famílias?', options:['Floresta','Cidade','Oceano','Deserto'], correctIndex:1, explanation:'Vivemos em cidades! Elas têm ruas, casas, escolas e muitas famílias. 🏘️' },
    { title:'Campo e cidade',       level:1, seedsReward:8,  question:'Onde os agricultores plantam alimentos?', options:['No shopping','No hospital','No campo','No aeroporto'], correctIndex:2, explanation:'Os agricultores plantam no campo (zona rural)! É de lá que vêm frutas, verduras e grãos. 🚜🌾' },
    { title:'Rio ou mar?',          level:1, seedsReward:8,  question:'O Amazonas é um famoso...?', options:['Deserto','Rio','Montanha','Vulcão'], correctIndex:1, explanation:'O Rio Amazonas é o maior rio do mundo em volume de água! Fica na região Norte do Brasil. 🌊🐊' },
    { title:'Regiões do Brasil',    level:1, seedsReward:8,  question:'O Brasil tem quantas grandes regiões?', options:['3','4','5','6'], correctIndex:2, explanation:'O Brasil tem 5 regiões: Norte, Nordeste, Centro-Oeste, Sudeste e Sul! 🗺️' },
    { title:'Bandeira brasileira',  level:1, seedsReward:8,  question:'Qual frase está escrita na bandeira do Brasil?', options:['Paz e Amor','Ordem e Progresso','Unidos Venceremos','Terra e Mar'], correctIndex:1, explanation:'Na bandeira do Brasil está escrito "Ordem e Progresso"! A frase foi inspirada no positivismo. 🇧🇷' },
    { title:'Clima do Brasil',      level:1, seedsReward:8,  question:'O Brasil é famoso por ter muitas florestas tropicais. Isso significa que o clima é...?', options:['Muito frio','Quente e úmido','Seco e gelado','Sempre nevando'], correctIndex:1, explanation:'O Brasil tem clima tropical — quente e úmido — que favorece a enorme biodiversidade das florestas! 🌴☀️' },
    // Nível 2 — 1º/2º ano (6–7 anos)
    { title:'Capital do Brasil',    level:2, seedsReward:10, question:'Qual é a capital do Brasil?', options:['São Paulo','Rio de Janeiro','Brasília','Salvador'], correctIndex:2, explanation:'Brasília é a capital do Brasil desde 1960! Foi construída no Centro-Oeste para ser uma capital mais central. 🏛️' },
    { title:'Maior cidade',         level:2, seedsReward:10, question:'Qual é a maior cidade do Brasil em número de habitantes?', options:['Rio de Janeiro','Brasília','Belo Horizonte','São Paulo'], correctIndex:3, explanation:'São Paulo é a maior cidade do Brasil, com mais de 12 milhões de habitantes! É o maior centro econômico do país. 🏙️' },
    { title:'Rio Amazonas',         level:2, seedsReward:10, question:'Em qual região do Brasil fica a maior parte da Floresta Amazônica?', options:['Sul','Sudeste','Norte','Nordeste'], correctIndex:2, explanation:'A Floresta Amazônica fica principalmente na região Norte! Estados como Amazonas, Pará e Acre abrigam grande parte dela. 🌳' },
    { title:'Nordeste brasileiro',  level:2, seedsReward:10, question:'Qual fenômeno climático é muito comum no Nordeste do Brasil?', options:['Neve','Furacão','Seca','Terremoto'], correctIndex:2, explanation:'O Nordeste sofre com secas prolongadas, especialmente no sertão. O Bioma Caatinga é adaptado a esse clima! 🌵☀️' },
    { title:'Sul do Brasil',        level:2, seedsReward:10, question:'Qual é a característica mais marcante do clima da região Sul?', options:['Calor extremo','Pode nevar no inverno','Sempre chove','Nunca tem frio'], correctIndex:1, explanation:'O Sul do Brasil tem as temperaturas mais baixas do país e pode nevar no inverno em estados como Santa Catarina! ❄️🏔️' },
    { title:'Estados brasileiros',  level:2, seedsReward:10, question:'Quantos estados tem o Brasil?', options:['20','24','26','30'], correctIndex:2, explanation:'O Brasil tem 26 estados mais o Distrito Federal (Brasília), totalizando 27 unidades federativas! 🗺️' },
    // Nível 3 — 3º/4º ano (8–9 anos)
    { title:'Biomas brasileiros',   level:3, seedsReward:15, question:'Qual é o bioma exclusivamente brasileiro?', options:['Cerrado','Pantanal','Caatinga','Mata Atlântica'], correctIndex:2, explanation:'A Caatinga é o único bioma 100% brasileiro! Cobre grande parte do Nordeste com vegetação adaptada à seca. 🌵' },
    { title:'Amazônia importancia', level:3, seedsReward:15, question:'Por que a Amazônia é chamada de "pulmão do mundo"?', options:['Por ter muitos animais','Por produzir grande quantidade de oxigênio','Por ter o maior rio','Por ter clima úmido'], correctIndex:1, explanation:'A Floresta Amazônica absorve CO₂ e libera oxigênio em enorme quantidade, regulando o clima global. 🌳🫁' },
    { title:'Cerrado',              level:3, seedsReward:15, question:'O Cerrado, bioma do Brasil Central, é importante porque...?', options:['É o maior bioma em área','Tem as maiores cidades','Abriga uma imensa biodiversidade e nasce a maioria dos rios brasileiros','Produz petróleo'], correctIndex:2, explanation:'O Cerrado abriga 5% de toda a biodiversidade do planeta e é o berço das principais bacias hidrográficas do Brasil! 🌾💧' },
    { title:'Regioes e producao',   level:3, seedsReward:15, question:'Qual região brasileira é conhecida como o maior polo industrial do país?', options:['Norte','Nordeste','Sul','Sudeste'], correctIndex:3, explanation:'O Sudeste concentra a maior parte da indústria do Brasil, especialmente em São Paulo. É a região mais rica do país. 🏭' },
    { title:'Populacao brasileira', level:3, seedsReward:15, question:'O Brasil é um país com muitas misturas de culturas. Essa mistura é chamada de...?', options:['Globalização','Diversidade cultural','Colonização','Urbanização'], correctIndex:1, explanation:'O Brasil tem enorme diversidade cultural graças à mistura de povos indígenas, africanos, europeus e asiáticos! 🎭🌍' },
    { title:'Pantanal',             level:3, seedsReward:15, question:'O Pantanal é a maior...?', options:['Floresta tropical do mundo','Planície alagável do mundo','Savana da América do Sul','Cordilheira da América'], correctIndex:1, explanation:'O Pantanal é a maior planície alagável do mundo! Fica entre Mato Grosso e Mato Grosso do Sul. É um paraíso de biodiversidade. 🐊🌊' },
    // Nível 4 — 5º/6º ano (10–11 anos)
    { title:'Formacao do territorio', level:4, seedsReward:20, question:'Quando o Brasil foi "descoberto" pelos portugueses?', options:['1492','1500','1822','1889'], correctIndex:1, explanation:'Pedro Álvares Cabral chegou ao Brasil em 22 de abril de 1500! Mas os indígenas já habitavam o território há milhares de anos. ⛵' },
    { title:'Relevo brasileiro',    level:4, seedsReward:20, question:'Qual é a maior planície do Brasil?', options:['Planície do Pantanal','Planície Amazônica','Planalto Central','Depressão do São Francisco'], correctIndex:1, explanation:'A Planície Amazônica é a maior do Brasil e uma das maiores do mundo! É cortada pelo Rio Amazonas e seus afluentes. 🌊🌳' },
    { title:'Bacias hidrograficas', level:4, seedsReward:20, question:'O Rio São Francisco é importantíssimo porque...?', options:['É o mais longo do Brasil','Abastece cidades do árido Nordeste e gera energia elétrica','Desemboca no Oceano Pacífico','Faz fronteira com a Argentina'], correctIndex:1, explanation:'O "Velho Chico" atravessa o sertão nordestino e é essencial para o abastecimento de água e energia da região. 💧⚡' },
    { title:'Desigualdade regional', level:4, seedsReward:20, question:'Por que existe desigualdade de desenvolvimento entre as regiões brasileiras?', options:['Diferença de tamanho','Fatores históricos, climáticos e econômicos','Apenas diferença de população','Só por causa do clima'], correctIndex:1, explanation:'A desigualdade regional vem de fatores históricos (colonização, escravidão), geográficos (seca, distância) e econômicos (investimentos). É um desafio nacional. 📊' },
    { title:'Amazonia legal',       level:4, seedsReward:20, question:'O que é a Amazônia Legal?', options:['Apenas a floresta amazônica','Área definida pelo governo que inclui 9 estados do Norte e partes do Centro-Oeste','Só o estado do Amazonas','A área protegida por lei ambiental'], correctIndex:1, explanation:'Amazônia Legal é uma área política criada para planejar o desenvolvimento: inclui 9 estados — mais de 60% do território brasileiro! 🗺️' },
    { title:'Litoral brasileiro',   level:4, seedsReward:20, question:'Qual é a extensão aproximada do litoral brasileiro?', options:['2.000 km','5.000 km','7.500 km','12.000 km'], correctIndex:2, explanation:'O Brasil tem cerca de 7.491 km de litoral! É uma das maiores costas litorâneas do mundo, do Amapá ao Rio Grande do Sul. 🏖️' },
    // Nível 5 — 7º ano+ (12 anos)
    { title:'Geopolitica brasileira', level:5, seedsReward:25, question:'O Brasil faz fronteira com quantos países da América do Sul?', options:['7','8','10','12'], correctIndex:2, explanation:'O Brasil faz fronteira com 10 dos 12 países da América do Sul — só não faz fronteira com Chile e Equador. É o único país que faz fronteira com quase todos! 🗺️' },
    { title:'Desmatamento',         level:5, seedsReward:25, question:'Qual é a principal causa do desmatamento na Amazônia brasileira?', options:['Urbanização','Expansão agropecuária e madeireirismo ilegal','Construção de rodovias','Garimpo de ouro'], correctIndex:1, explanation:'A expansão da agropecuária (pastagens e soja) é a principal causa, seguida pela extração ilegal de madeira. É um desafio ambiental urgente. 🌳⚠️' },
    { title:'Urbanizacao brasileira', level:5, seedsReward:25, question:'Qual percentual aproximado da população brasileira vive em cidades?', options:['50%','65%','87%','95%'], correctIndex:2, explanation:'Cerca de 87% dos brasileiros vivem em áreas urbanas! O Brasil passou por rápida urbanização na segunda metade do século XX. 🏙️' },
    { title:'Matriz energetica',    level:5, seedsReward:25, question:'Qual é a principal fonte de energia elétrica do Brasil?', options:['Térmica (carvão)','Nuclear','Hidrelétrica','Solar'], correctIndex:2, explanation:'O Brasil é um dos líderes mundiais em energia hidrelétrica — mais de 60% da energia elétrica vem de usinas hidrelétricas como Itaipu e Belo Monte. 💧⚡' },
    { title:'IBGE e censo',         level:5, seedsReward:25, question:'O IBGE (Instituto Brasileiro de Geografia e Estatística) é responsável por...?', options:['Cobrar impostos','Defender o território nacional','Coletar dados populacionais e geográficos do Brasil','Fiscalizar as eleições'], correctIndex:2, explanation:'O IBGE faz o Censo Demográfico a cada 10 anos e coleta dados sobre população, economia e geografia. Essencial para políticas públicas! 📊' },
    { title:'Economia brasileira',  level:5, seedsReward:25, question:'O Brasil integra o grupo BRICS. O que isso significa?', options:['É um bloco militar','Agrupa as maiores democracias do mundo','Reúne economias emergentes com grande potencial: Brasil, Rússia, Índia, China e África do Sul','É uma aliança comercial exclusiva da América do Sul'], correctIndex:2, explanation:'Os BRICS reúnem grandes economias emergentes. O Brasil se destaca por seu tamanho territorial, população e produção agrícola e mineral. 🌐' },
  ],

async function seed() {
  await connectDB();
  const prisma = getPrisma();
  console.log('\n🌱 BrotoSmart Seeds v3 — 3 trilhas, 5 níveis\n');

  for (const trackData of TRACKS) {
    const track = await prisma.learningTrack.upsert({
      where: { slug: trackData.slug }, create: trackData, update: trackData,
    });
    console.log(`✅ Trilha: ${track.name}`);

    const acts = ACTIVITIES[trackData.slug] || [];
    for (const act of acts) {
      await prisma.activity.create({ data: { ...act, trackId: track.id, options: act.options } });
    }

    const byLevel = acts.reduce((acc, a) => { acc[a.level] = (acc[a.level] || 0) + 1; return acc; }, {});
    const LABELS = ['', 'Infantil(4-5)', '1º/2ºano(6-7)', '3º/4ºano(8-9)', '5º/6ºano(10-11)', '7ºano+(12)'];
    Object.entries(byLevel).forEach(([l, q]) => console.log(`   Nível ${l} (${LABELS[l]}): ${q} questões`));
    console.log('');
  }

  const total = Object.values(ACTIVITIES).flat().length;
  console.log(`🎉 Seed concluído! ${total} atividades no banco.\n`);
  await disconnectDB();
}

seed().catch((e) => { console.error('❌', e); process.exit(1); });
