-- AfriQuiz — conhecimentos iniciais da secção Aprender (textos originais; obras citadas como referência)
insert into public.articles (category_id, title, summary, body, sources, status, reviewed_at) values
((select id from public.categories where slug = 'afrocentrismo'), 'Cheikh Anta Diop: a história africana contada a partir de África', 'Historiador, antropólogo e físico senegalês que defendeu a origem africana da civilização egípcia antiga e a unidade cultural do continente.', 'Cheikh Anta Diop (1923–1986) nasceu em Diourbel, no Senegal, e estudou em Paris física, química, história e antropologia. Tornou-se uma das vozes mais influentes do pensamento africano do século XX ao propor que a história de África fosse estudada a partir de fontes e perspetivas africanas, e não apenas pelo olhar europeu.

A sua tese central é a de que o Antigo Egito (Kemet) foi uma civilização negra africana, ligada culturalmente ao resto do continente. Para a sustentar, cruzou linguística (comparando o egípcio antigo com línguas como o wolof), antropologia, arqueologia e textos de autores gregos antigos. Estas ideias, publicadas em 1954 em Nations nègres et culture, foram muito contestadas em França, mas abriram um debate que mudou a historiografia africana.

Diop defendia também a unidade cultural de África: apesar da diversidade de povos, haveria traços comuns na organização familiar, na realeza e na relação com a terra, diferentes dos modelos europeus. Para ele, reconhecer este passado comum era condição para a unidade política do continente.

Em 1966 fundou em Dacar, no IFAN, um laboratório de datação por radiocarbono, um dos primeiros em África. Em 1974 participou no simpósio da UNESCO, no Cairo, sobre o povoamento do Antigo Egito, onde apresentou as suas provas perante especialistas internacionais.

Depois da sua morte, a Universidade de Dacar passou a chamar-se Universidade Cheikh Anta Diop (1987). A sua obra continua a inspirar o afrocentrismo e os estudos africanos em todo o mundo.', 'Diop, C. A. (1954). Nations nègres et culture. Paris: Présence Africaine.

Diop, C. A. (1959). L''Unité culturelle de l''Afrique noire. Paris: Présence Africaine.

Diop, C. A. (1967). Antériorité des civilisations nègres: mythe ou vérité historique? Paris: Présence Africaine.

Diop, C. A. (1981). Civilisation ou barbarie. Paris: Présence Africaine.

UNESCO (1978). The Peopling of Ancient Egypt and the Deciphering of Meroitic Script (actas do simpósio do Cairo, 1974).', 'approved', now()),
((select id from public.categories where slug = 'afrocracia'), 'Frantz Fanon: psiquiatria, colonialismo e libertação', 'Psiquiatra martinicano que analisou os efeitos psicológicos do racismo e do colonialismo e se tornou uma referência das lutas de libertação africanas.', 'Frantz Fanon (1925–1961) nasceu na Martinica, então colónia francesa. Combateu na Segunda Guerra Mundial pelo exército francês, estudou medicina e psiquiatria em Lyon e, em 1953, foi dirigir um serviço do hospital psiquiátrico de Blida-Joinville, na Argélia.

No seu primeiro livro, Peau noire, masques blancs (1952), analisou como o racismo colonial afeta a mente das pessoas negras: a sensação de ser visto apenas através da cor da pele e a pressão para imitar o colonizador para ser aceite. Fanon mostrou que o problema não estava no indivíduo, mas numa sociedade organizada pelo racismo.

Na Argélia, o contacto com doentes marcados pela violência da guerra levou-o a juntar-se à Frente de Libertação Nacional (FLN). Demitiu-se do hospital em 1956 e passou a trabalhar para o movimento, incluindo como representante diplomático em vários países africanos.

Les Damnés de la Terre (1961), publicado pouco antes da sua morte, tornou-se um dos livros mais lidos pelos movimentos de independência. Nele, Fanon analisa a violência do sistema colonial, critica as elites que, depois da independência, apenas substituem os antigos colonos, e defende a construção de uma consciência nacional ligada ao povo.

Fanon morreu de leucemia aos 36 anos, nos Estados Unidos, em dezembro de 1961, poucos meses antes da independência da Argélia. As suas ideias continuam presentes nos estudos pós-coloniais, na psicologia e nos debates sobre racismo.', 'Fanon, F. (1952). Peau noire, masques blancs. Paris: Éditions du Seuil. (Ed. port.: Pele negra, máscaras brancas.)

Fanon, F. (1959). L''An V de la révolution algérienne. Paris: Maspero.

Fanon, F. (1961). Les Damnés de la Terre. Paris: Maspero. (Ed. port.: Os condenados da Terra.)

Fanon, F. (1964). Pour la révolution africaine. Paris: Maspero.', 'approved', now()),
((select id from public.categories where slug = 'personalidades'), 'Malcolm X: do bairro ao pan-africanismo', 'Líder afro-americano que defendeu a dignidade, a autodefesa e a ligação dos negros dos Estados Unidos às lutas de África.', 'Malcolm X nasceu como Malcolm Little, em 1925, em Omaha, nos Estados Unidos. A infância foi marcada pela violência racista e pela morte do pai, que era seguidor de Marcus Garvey. Na juventude viveu em Boston e Nova Iorque e foi preso por roubo.

Na prisão dedicou-se à leitura e aderiu à Nação do Islão. Ao sair, tornou-se o seu porta-voz mais conhecido. Trocou o apelido Little por X, para recusar o nome herdado da escravatura. Defendia o orgulho negro, a autossuficiência das comunidades e o direito de se defenderem da violência racista.

Em 1964 rompeu com a Nação do Islão. No mesmo ano fez a peregrinação a Meca, adotou o nome El-Hajj Malik El-Shabazz e passou a ver a luta dos afro-americanos como parte de uma luta internacional pelos direitos humanos. Visitou vários países africanos, entre os quais o Gana e a Nigéria, e fundou a Organização da Unidade Afro-Americana (OAAU), inspirada na Organização da Unidade Africana.

Malcolm X foi assassinado a 21 de fevereiro de 1965, em Nova Iorque, durante um discurso. A Autobiografia de Malcolm X, escrita com Alex Haley e publicada nesse ano, tornou-se um dos livros mais marcantes da história afro-americana.

O seu percurso mostra a ligação entre a diáspora e África: para ele, os negros das Américas só se libertariam plenamente reconhecendo as suas raízes africanas.', 'Malcolm X & Haley, A. (1965). The Autobiography of Malcolm X. New York: Grove Press. (Ed. port.: Autobiografia de Malcolm X.)

Malcolm X (1965). Malcolm X Speaks: Selected Speeches and Statements (org. George Breitman). New York: Merit Publishers.

Marable, M. (2011). Malcolm X: A Life of Reinvention. New York: Viking.', 'approved', now()),
((select id from public.categories where slug = 'afrocentrismo'), 'Amos N. Wilson: psicologia e poder africano', 'Psicólogo afro-americano que estudou o desenvolvimento das crianças negras e a ligação entre consciência, educação e poder económico.', 'Amos N. Wilson (1941–1995) nasceu em Hattiesburg, no Mississípi, nos Estados Unidos. Trabalhou como psicólogo, assistente social e investigador, e foi professor no City College de Nova Iorque. Fundou a editora Afrikan World InfoSystems para publicar os seus próprios livros.

O seu primeiro grande trabalho, The Developmental Psychology of the Black Child (1978), criticou os estudos que tratavam as crianças negras como deficientes em comparação com as brancas. Wilson defendeu que o desenvolvimento das crianças deve ser compreendido no seu contexto cultural e histórico, e que a escola e a família podem reforçar a sua autoestima e capacidade.

Noutros livros, como Black-on-Black Violence (1990), analisou a violência dentro das comunidades negras não como uma característica dos indivíduos, mas como consequência de séculos de opressão, pobreza e de uma imagem negativa de si próprios aprendida na sociedade racista.

Em The Falsification of Afrikan Consciousness (1993), mostrou como a forma como a história é ensinada pode servir para manter relações de poder. E em Blueprint for Black Power (1998), publicado depois da sua morte, propôs um plano para que as comunidades africanas e da diáspora construíssem poder económico, político e educativo próprio.

Para Wilson, conhecer a história africana não era apenas cultura: era uma ferramenta prática de saúde mental e de transformação social.', 'Wilson, A. N. (1978). The Developmental Psychology of the Black Child. New York: Africana Research Publications.

Wilson, A. N. (1990). Black-on-Black Violence: The Psychodynamics of Black Self-Annihilation in Service of White Domination. New York: Afrikan World InfoSystems.

Wilson, A. N. (1993). The Falsification of Afrikan Consciousness: Eurocentric History, Psychiatry and the Politics of White Supremacy. New York: Afrikan World InfoSystems.

Wilson, A. N. (1998). Blueprint for Black Power: A Moral, Political and Economic Imperative for the Twenty-First Century. New York: Afrikan World InfoSystems.', 'approved', now()),
((select id from public.categories where slug = 'personalidades'), 'W. E. B. Du Bois: a dupla consciência e os Congressos Pan-Africanos', 'Sociólogo e historiador afro-americano, um dos fundadores do pan-africanismo moderno, que viveu os últimos anos no Gana.', 'William Edward Burghardt Du Bois (1868–1963) nasceu em Massachusetts, nos Estados Unidos. Em 1895 tornou-se o primeiro afro-americano a doutorar-se em Harvard. Foi sociólogo, historiador, jornalista e ativista durante quase setenta anos.

Em The Souls of Black Folk (1903) apresentou a ideia de dupla consciência: a experiência de se ver ao mesmo tempo através dos próprios olhos e através do olhar de uma sociedade que despreza os negros. O livro tornou-se um clássico da literatura e das ciências sociais.

Em 1909 participou na fundação da NAACP, uma das principais organizações de defesa dos direitos civis nos Estados Unidos, e dirigiu durante anos a sua revista, The Crisis.

Du Bois foi também um dos grandes organizadores do pan-africanismo. Entre 1919 e 1927 promoveu vários Congressos Pan-Africanos, que reuniram representantes de África, das Caraíbas e das Américas para exigir direitos para os povos colonizados. Esteve ainda presente no Congresso de Manchester, em 1945, ao lado de futuros líderes africanos como Kwame Nkrumah.

No fim da vida aceitou o convite de Nkrumah para viver no Gana, onde trabalhou numa Enciclopédia Africana. Morreu em Acra, em agosto de 1963, na véspera da Marcha sobre Washington.', 'Du Bois, W. E. B. (1903). The Souls of Black Folk. Chicago: A. C. McClurg. (Ed. port.: As almas do povo negro.)

Du Bois, W. E. B. (1935). Black Reconstruction in America. New York: Harcourt, Brace.

Du Bois, W. E. B. (1947). The World and Africa. New York: Viking Press.', 'approved', now()),
((select id from public.categories where slug = 'personalidades'), 'Marcus Garvey: orgulho negro e o regresso a África', 'Líder jamaicano que criou o maior movimento de massas negro do início do século XX, defendendo a união e a autonomia económica dos povos africanos.', 'Marcus Mosiah Garvey (1887–1940) nasceu na Jamaica. Trabalhou como tipógrafo e jornalista e viajou pela América Central e por Londres, onde observou de perto a discriminação contra os trabalhadores negros.

Em 1914 fundou na Jamaica a Associação Universal para o Progresso Negro (UNIA). Mudou-se para Nova Iorque em 1916 e transformou a UNIA num movimento com centenas de milhares de membros, presente nas Américas, nas Caraíbas e em África. O seu jornal, The Negro World, circulava em vários países.

Garvey defendia o orgulho racial, a ideia de que os africanos e os seus descendentes deviam ter as suas próprias empresas, instituições e, um dia, uma nação africana forte e independente. Em 1919 criou a Black Star Line, uma companhia de navegação com tripulações negras, pensada para o comércio e para ligar a diáspora a África.

A companhia teve graves problemas financeiros e Garvey foi condenado por fraude postal nos Estados Unidos, em 1923, e deportado para a Jamaica em 1927. Morreu em Londres, em 1940.

Apesar das controvérsias, a sua influência foi enorme: inspirou Kwame Nkrumah, o movimento rastafári e várias gerações de ativistas. A estrela negra da bandeira do Gana e as cores vermelho, preto e verde usadas pela UNIA ficaram como símbolos do pan-africanismo.', 'Garvey, M. (1923–1925). Philosophy and Opinions of Marcus Garvey (org. Amy Jacques Garvey). New York: Universal Publishing House.

Cronon, E. D. (1955). Black Moses: The Story of Marcus Garvey and the UNIA. Madison: University of Wisconsin Press.

Hill, R. A. (org.) (1983–). The Marcus Garvey and UNIA Papers. Berkeley: University of California Press.', 'approved', now()),
((select id from public.categories where slug = 'afrocracia'), 'Kwame Nkrumah: a independência do Gana e a unidade africana', 'Primeiro presidente do Gana, que levou o país à independência em 1957 e defendeu a união política de todo o continente.', 'Kwame Nkrumah (1909–1972) nasceu na então Costa do Ouro, colónia britânica. Estudou nos Estados Unidos e em Inglaterra, onde contactou com ideias pan-africanistas e participou na organização do Congresso Pan-Africano de Manchester, em 1945.

De regresso a casa, fundou em 1949 o Convention People''s Party e liderou campanhas de ação positiva, com greves e protestos não violentos. Foi preso pelas autoridades coloniais, mas o seu partido venceu as eleições e ele tornou-se chefe do governo. A 6 de março de 1957, a Costa do Ouro tornou-se independente com o nome de Gana, a primeira colónia da África subsariana a conquistar a independência.

Nkrumah via a independência do Gana como o início da libertação de todo o continente. Apoiou outros movimentos de libertação e defendeu um governo africano unido. Esteve entre os fundadores da Organização da Unidade Africana (OUA), em 1963.

Nos seus livros alertou para o neocolonialismo: a situação em que um país é formalmente independente, mas a sua economia e política continuam controladas de fora. Esta ideia continua muito usada para analisar as relações entre África e as antigas potências.

O seu governo tornou-se cada vez mais autoritário e, em 1966, foi derrubado por um golpe militar enquanto estava no estrangeiro. Morreu no exílio, em 1972. Hoje é lembrado no Gana como pai da nação.', 'Nkrumah, K. (1957). Ghana: The Autobiography of Kwame Nkrumah. Edinburgh: Thomas Nelson.

Nkrumah, K. (1963). Africa Must Unite. London: Heinemann.

Nkrumah, K. (1964). Consciencism: Philosophy and Ideology for De-Colonization. London: Heinemann.

Nkrumah, K. (1965). Neo-Colonialism: The Last Stage of Imperialism. London: Thomas Nelson.', 'approved', now()),
((select id from public.categories where slug = 'afrocracia'), 'Amílcar Cabral: cultura e libertação na Guiné e em Cabo Verde', 'Agrónomo e líder do PAIGC que fez da cultura e do conhecimento do terreno armas da luta contra o colonialismo português.', 'Amílcar Cabral (1924–1973) nasceu em Bafatá, na Guiné, filho de pais cabo-verdianos. Estudou agronomia em Lisboa, onde conviveu com outros estudantes africanos, como Agostinho Neto e Mário Pinto de Andrade, e participou em grupos que discutiam a cultura africana e o fim do colonialismo.

Como agrónomo, fez o recenseamento agrícola da Guiné, o que lhe deu um conhecimento profundo do território, dos povos e da forma como viviam. Esse conhecimento foi decisivo para a estratégia de luta.

Em 1956 esteve na fundação do Partido Africano para a Independência da Guiné e Cabo Verde (PAIGC). Depois de anos de tentativas pacíficas, o partido iniciou a luta armada em 1963. Nas zonas libertadas, o PAIGC organizou escolas, postos de saúde e tribunais populares, mostrando como poderia ser um novo Estado.

Cabral é conhecido pelas suas reflexões teóricas. No discurso A arma da teoria (Havana, 1966) defendeu que cada luta deve partir da análise concreta da sua própria realidade. Em textos sobre cultura, mostrou que a libertação nacional é também um ato de cultura: um povo que resiste afirma a sua identidade e a sua história.

Foi assassinado em Conacri a 20 de janeiro de 1973. A Guiné-Bissau declarou a independência poucos meses depois, em setembro de 1973, e Cabo Verde em 1975.', 'Cabral, A. (1966). A arma da teoria. Discurso na Conferência Tricontinental, Havana.

Cabral, A. (1973). Return to the Source: Selected Speeches of Amílcar Cabral. New York: Monthly Review Press.

Cabral, A. (1976–1977). Unidade e Luta (Obras escolhidas, 2 vols.). Lisboa: Seara Nova.

Chabal, P. (1983). Amílcar Cabral: Revolutionary Leadership and People''s War. Cambridge: Cambridge University Press.', 'approved', now()),
((select id from public.categories where slug = 'africa'), 'Walter Rodney: como a Europa subdesenvolveu África', 'Historiador guianense que mostrou como a escravatura e o colonialismo empobreceram África enquanto enriqueciam a Europa.', 'Walter Rodney (1942–1980) nasceu em Georgetown, na Guiana. Estudou na Universidade das Índias Ocidentais, na Jamaica, e doutorou-se em Londres com uma tese sobre a história da Alta Costa da Guiné, na África Ocidental.

Ensinou na Universidade de Dar es Salaam, na Tanzânia, um dos centros intelectuais mais vivos de África nos anos 60 e 70. Foi aí que escreveu a sua obra mais famosa, How Europe Underdeveloped Africa (1972).

Nesse livro, Rodney contraria a ideia de que África era pobre por natureza ou por atraso próprio. Mostra que, antes do contacto com a Europa, existiam em África reinos, comércio, tecnologia e organizações políticas complexas. Defende que o comércio de escravos e depois o colonialismo retiraram ao continente milhões de pessoas, recursos e a possibilidade de decidir o seu próprio caminho, enquanto esse mesmo processo ajudava a enriquecer a Europa.

Rodney não era apenas académico: falava em bairros, sindicatos e grupos de estudantes, explicando a história de forma acessível. Na Jamaica, em 1968, foi proibido de regressar ao país por causa da sua atividade política, o que provocou grandes protestos.

De volta à Guiana, tornou-se uma figura importante da oposição ao governo. Foi assassinado com uma bomba em 1980. O seu livro continua a ser leitura obrigatória em estudos africanos.', 'Rodney, W. (1970). A History of the Upper Guinea Coast, 1545–1800. Oxford: Clarendon Press.

Rodney, W. (1972). How Europe Underdeveloped Africa. London: Bogle-L''Ouverture; Dar es Salaam: Tanzania Publishing House. (Ed. port.: Como a Europa subdesenvolveu a África.)

Rodney, W. (1969). The Groundings with My Brothers. London: Bogle-L''Ouverture.', 'approved', now()),
((select id from public.categories where slug = 'afrocentrismo'), 'Molefi Kete Asante e a afrocentricidade', 'Académico afro-americano que deu forma à teoria da afrocentricidade: estudar o mundo colocando os povos africanos como sujeitos da sua própria história.', 'Molefi Kete Asante nasceu em 1942, na Geórgia, nos Estados Unidos. É professor na Universidade Temple, em Filadélfia, onde, em 1988, criou o primeiro programa de doutoramento em Estudos Afro-Americanos dos Estados Unidos.

Asante é conhecido por ter desenvolvido a teoria da afrocentricidade, apresentada em livros como Afrocentricity (1980) e The Afrocentric Idea (1987). A ideia central é simples: ao estudar a história, a cultura ou a sociedade, os povos africanos devem ser vistos como agentes e sujeitos, e não como objetos ou figurantes da história de outros.

A afrocentricidade não pretende dizer que África é superior, mas corrigir uma visão em que a Europa aparece como centro e medida de tudo. Por isso, Asante valoriza fontes africanas, línguas africanas e autores africanos, e inspira-se no trabalho de Cheikh Anta Diop.

A teoria teve grande influência nos estudos africanos e afro-americanos, na educação e nos movimentos culturais. Também recebeu críticas de historiadores que acham que, por vezes, simplifica a enorme diversidade de África. Este debate é, em si mesmo, uma parte importante para compreender o afrocentrismo.

Asante escreveu dezenas de livros e continua a ser uma das principais referências do pensamento afrocêntrico.', 'Asante, M. K. (1980). Afrocentricity: The Theory of Social Change. Buffalo: Amulefi.

Asante, M. K. (1987). The Afrocentric Idea. Philadelphia: Temple University Press.

Asante, M. K. (2007). An Afrocentric Manifesto. Cambridge: Polity Press.', 'approved', now()),
((select id from public.categories where slug = 'personalidades'), 'Steve Biko e a Consciência Negra', 'Estudante e ativista sul-africano que defendeu que a libertação começa pela mente, com a valorização da identidade negra contra o apartheid.', 'Stephen Bantu Biko (1946–1977) nasceu na província do Cabo Oriental, na África do Sul, durante o apartheid. Estudou medicina na Universidade de Natal, na secção reservada a estudantes negros.

Insatisfeito com organizações estudantis dominadas por brancos liberais, ajudou a fundar, em 1968, a Organização dos Estudantes Sul-Africanos (SASO), só para estudantes negros. Daqui nasceu o Movimento da Consciência Negra.

Para Biko, o apartheid não oprimia apenas os corpos, mas também as mentes: muitas pessoas negras acabavam por acreditar que eram inferiores. A primeira tarefa da libertação era, por isso, psicológica e cultural: recuperar o orgulho, a autoestima e a capacidade de os próprios negros liderarem a sua luta. O movimento organizou também projetos comunitários de saúde, educação e pequenas empresas.

O governo proibiu Biko de viajar, de falar em público e de ser citado. Mesmo assim, as suas ideias influenciaram a juventude que protagonizou a revolta do Soweto, em 1976.

Em agosto de 1977 foi preso e torturado pela polícia. Morreu sob custódia em setembro desse ano. A sua morte causou indignação internacional e tornou-se um símbolo da brutalidade do apartheid. Os seus textos foram reunidos no livro I Write What I Like (1978).', 'Biko, S. (1978). I Write What I Like (org. Aelred Stubbs). London: Bowerdean Press.

Woods, D. (1978). Biko. London: Paddington Press.', 'approved', now());
