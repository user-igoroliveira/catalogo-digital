document.addEventListener('DOMContentLoaded', () => {
    // 1. Carregar o Cabeçalho (header.html)
    fetch('/components/header.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('main-header').innerHTML = html;
        })
        .catch(error => console.error('Erro ao carregar o cabeçalho:', error));

        // 2. Carregar o Rodapé (footer.html)
    fetch('/components/footer.html')
        .then(response => response.text())
        .then(html => {
            // Certifique-se de que o elemento main-footer-placeholder existe no seu HTML principal
            const mainFooterPlaceholder = document.getElementById('main-footer-placeholder');
            if (mainFooterPlaceholder) {
                mainFooterPlaceholder.innerHTML = html;

                // Atualiza o ano no footer dinamicamente
                const currentYearSpan = document.getElementById('current-year');
                if (currentYearSpan) {
                    currentYearSpan.textContent = new Date().getFullYear();
                }
            } else {
                console.error('Elemento #main-footer-placeholder não encontrado no DOM.');
            }
        })
        .catch(error => console.error('Erro ao carregar o rodapé:', error));

    // 3. Lógica para carregar e exibir as fontes (apenas se os elementos existirem)
    const fontListContainer = document.getElementById('font-list-container');
    const fontPreviewInput = document.getElementById('font-preview-text');

    // Variáveis de paginação
    const fontsPerPage = 12; // Quantidade de fontes por página
    let currentPage = 1;     // Página atual, começa na 1
    let allFonts = [];       // Array para armazenar todas as fontes carregadas
    let filteredFonts = [];  // Array para armazenar fontes filtradas (se você adicionar busca no futuro)

    // Elementos de paginação
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfoSpan = document.getElementById('page-info');

    if (fontListContainer && fontPreviewInput) {
        const defaultPreviewText = "Papel & Estilo";
        const importedGoogleFonts = new Set();

        async function fetchAllFonts() {
            try {
                const response = await fetch('../data/fontes.json');
                allFonts = await response.json(); // Armazena todas as fontes
                filteredFonts = allFonts; // Inicialmente, fontes filtradas são todas as fontes
                renderFonts(); // Renderiza a primeira página
            } catch (error) {
                console.error('Erro ao carregar as fontes:', error);
                if (fontListContainer) {
                    fontListContainer.innerHTML = '<p>Não foi possível carregar as fontes. Tente novamente mais tarde.</p>';
                }
            }
        }

        function renderFonts() {
            fontListContainer.innerHTML = ''; // Limpa o container antes de renderizar

            const totalPages = Math.ceil(filteredFonts.length / fontsPerPage);
            pageInfoSpan.textContent = `Página ${currentPage} de ${totalPages}`;

            // Desabilita/habilita botões
            prevPageBtn.disabled = currentPage === 1;
            nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;

            const startIndex = (currentPage - 1) * fontsPerPage;
            const endIndex = startIndex + fontsPerPage;
            const fontsToDisplay = filteredFonts.slice(startIndex, endIndex);

            fontsToDisplay.forEach(font => {
                const fontCard = document.createElement('div');
                fontCard.classList.add('font-card');
                fontCard.dataset.fontId = font.id;

                const fontName = document.createElement('h3');
                fontName.textContent = font.name;

                const fontCategory = document.createElement('p');
                fontCategory.classList.add('font-category');
                fontCategory.textContent = font.category;

                const fontPreview = document.createElement('p');
                fontPreview.classList.add('font-preview-text');
                fontPreview.textContent = fontPreviewInput.value || defaultPreviewText;
                fontPreview.style.fontFamily = `"${font.name}", sans-serif`;

                fontCard.appendChild(fontName);
                fontCard.appendChild(fontCategory);
                fontCard.appendChild(fontPreview);
                fontListContainer.appendChild(fontCard);

                // Lógica de carregamento de fontes (mantida)
                if (font.source === "local" && font.variants) {
                    font.variants.forEach(variant => {
                        const fontFace = new FontFace(
                            font.name,
                            `url(../assets/fonts/${variant.file})`,
                            {
                                weight: variant.weight === 'regular' ? 'normal' : variant.weight,
                                style: variant.style
                            }
                        );
                        // Verifica se a fonte já foi adicionada para evitar erros de FontFace duplicada
                        if (!document.fonts.has(fontFace)) { // Melhoria: Evitar adicionar FontFace se já existir
                            document.fonts.add(fontFace);
                            fontFace.load().then(() => {
                                console.log(`Fonte local ${font.name} - ${variant.weight} carregada.`);
                            }).catch(error => {
                                console.error(`Erro ao carregar fonte local ${font.name} - ${variant.file}:`, error);
                            });
                        }
                    });
                } else if (font.source === "google-fonts" && font.importUrl) {
                    if (!importedGoogleFonts.has(font.importUrl)) {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = font.importUrl;
                        document.head.appendChild(link);
                        importedGoogleFonts.add(font.importUrl);
                        console.log(`Fonte do Google Fonts ${font.name} importada.`);
                    }
                }
            });
        }



        // Event Listeners para os botões de paginação
        if (prevPageBtn) { // Verifique se o botão existe antes de adicionar o listener
            prevPageBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderFonts();
                }
            });
        }

        if (nextPageBtn) { // Verifique se o botão existe antes de adicionar o listener
            nextPageBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(filteredFonts.length / fontsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    renderFonts();
                }
            });
        }

        // Atualizar texto de preview ao digitar
        fontPreviewInput.addEventListener('input', () => {
            const currentText = fontPreviewInput.value || defaultPreviewText;
            document.querySelectorAll('.font-preview-text').forEach(element => {
                element.textContent = currentText;
            });
        });

        // Chama a função para buscar todas as fontes e renderizar a primeira página
        fetchAllFonts();
    } // Fim da condição que verifica se os elementos das fontes existem
});

// 4. Lógica para o Acordeão do FAQ (esta seção já estava corretamente fora do bloco das fontes)
    const faqQuestions = document.querySelectorAll('.faq-question');

    if (faqQuestions.length > 0) {
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                question.classList.toggle('active');
                const answer = question.nextElementSibling;
                if (question.classList.contains('active')) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                } else {
                    answer.style.maxHeight = '0';
                }
            });
        });
    }
