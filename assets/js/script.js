document.addEventListener('DOMContentLoaded', () => {
  // 1. Carregar o Cabeçalho (header.html)
  fetch('/components/header.html')
    .then((response) => response.text())
    .then((html) => {
      document.getElementById('main-header').innerHTML = html;
    })
    .catch((error) => console.error('Erro ao carregar o cabeçalho:', error));

  // 2. Carregar o Rodapé (footer.html)
  fetch('/components/footer.html')
    .then((response) => response.text())
    .then((html) => {
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
    .catch((error) => console.error('Erro ao carregar o rodapé:', error));

  // 3. Lógica para carregar e exibir as fontes (apenas se os elementos existirem)
  // Este bloco só será executado se os elementos relacionados às fontes existirem na página
  const fontListContainer = document.getElementById('font-list-container');
  const fontPreviewInput = document.getElementById('font-preview-text');
  const fontPrevPageBtn = document.getElementById('prev-page-btn'); // Estes IDs podem precisar ser únicos se a paginação de fontes e imagens estiverem na mesma página
  const fontNextPageBtn = document.getElementById('next-page-btn');
  const fontPageInfoSpan = document.getElementById('page-info');

  if (fontListContainer && fontPreviewInput && fontPrevPageBtn && fontNextPageBtn && fontPageInfoSpan) {
    const fontsPerPage = 12;
    let currentPageFonts = 1;
    let allFonts = [];
    let filteredFonts = [];
    const importedGoogleFonts = new Set();
    const importedLocalFonts = new Set();

    async function fetchAllFonts() {
      try {
        const response = await fetch('../data/fontes.json');
        allFonts = await response.json();
        filteredFonts = allFonts;
        renderFonts();
      } catch (error) {
        console.error('Erro ao carregar as fontes:', error);
        fontListContainer.innerHTML = '<p>Não foi possível carregar as fontes. Tente novamente mais tarde.</p>';
      }
    }

    function renderFonts() {
      fontListContainer.innerHTML = '';

      const totalPages = Math.ceil(filteredFonts.length / fontsPerPage);
      fontPageInfoSpan.textContent = `Página ${currentPageFonts} de ${totalPages}`;

      fontPrevPageBtn.disabled = currentPageFonts === 1;
      fontNextPageBtn.disabled = currentPageFonts === totalPages || totalPages === 0;

      const startIndex = (currentPageFonts - 1) * fontsPerPage;
      const endIndex = startIndex + fontsPerPage;
      const fontsToDisplay = filteredFonts.slice(startIndex, endIndex);

      fontsToDisplay.forEach((font) => {
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
        fontPreview.textContent = fontPreviewInput.value || 'Papel & Estilo';
        fontPreview.style.fontFamily = `"${font.name}", sans-serif`;

        fontCard.appendChild(fontName);
        fontCard.appendChild(fontCategory);
        fontCard.appendChild(fontPreview);
        fontListContainer.appendChild(fontCard);

        if (font.source === 'local' && font.variants) {
          font.variants.forEach((variant) => {
            const fontUrl = `../assets/fonts/${variant.file}`;
            const fontKey = `${font.name}-${variant.weight}-${variant.style}-${fontUrl}`;

            if (!importedLocalFonts.has(fontKey)) {
              const fontFace = new FontFace(font.name, `url(${fontUrl})`, {
                weight: variant.weight === 'regular' ? 'normal' : variant.weight,
                style: variant.style,
              });
              document.fonts.add(fontFace);
              importedLocalFonts.add(fontKey);
              fontFace
                .load()
                .then(() => {
                  console.log(`Fonte local ${font.name} - ${variant.weight} carregada.`);
                })
                .catch((error) => {
                  console.error(`Erro ao carregar fonte local ${font.name} - ${variant.file}:`, error);
                });
            }
          });
        } else if (font.source === 'google-fonts' && font.importUrl) {
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

    fontPrevPageBtn.addEventListener('click', () => {
      if (currentPageFonts > 1) {
        currentPageFonts--;
        renderFonts();
      }
    });

    fontNextPageBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredFonts.length / fontsPerPage);
      if (currentPageFonts < totalPages) {
        currentPageFonts++;
        renderFonts();
      }
    });

    fontPreviewInput.addEventListener('input', () => {
      const currentText = fontPreviewInput.value || 'Papel & Estilo';
      document.querySelectorAll('.font-preview-text').forEach((element) => {
        element.textContent = currentText;
      });
    });

    fetchAllFonts();
  } // Fim da condição de verificação dos elementos das fontes

  // 4. Lógica para Paginação de Imagens
  // Este bloco só será executado se os elementos relacionados à grid de imagens existirem
  const imageGridContainer = document.querySelector('.category-grid');
  const imagePrevPageBtn = document.getElementById('prev-page-btn'); // Os IDs podem ser os mesmos se estiverem em páginas diferentes
  const imageNextPageBtn = document.getElementById('next-page-btn');
  const imagePageInfoSpan = document.getElementById('page-info');
  const allImageCards = Array.from(document.querySelectorAll('.category-card.image-card')); // Converte NodeList para Array

  // Você mencionou 46 imagens, então 12 por página é um bom começo. Ajuste conforme necessário.
  const imagesPerPage = 12;
  let currentImagePage = 1;
  // filteredImageCards será útil se você adicionar filtros/pesquisa no futuro
  let filteredImageCards = allImageCards;

  if (imageGridContainer && imagePrevPageBtn && imageNextPageBtn && imagePageInfoSpan && allImageCards.length > 0) {
    function renderImages() {
      const totalPages = Math.ceil(filteredImageCards.length / imagesPerPage);
      imagePageInfoSpan.textContent = `Página ${currentImagePage} de ${totalPages}`;

      imagePrevPageBtn.disabled = currentImagePage === 1;
      imageNextPageBtn.disabled = currentImagePage === totalPages || totalPages === 0;

      const startIndex = (currentImagePage - 1) * imagesPerPage;
      const endIndex = startIndex + imagesPerPage;

      filteredImageCards.forEach((card, index) => {
        if (index >= startIndex && index < endIndex) {
          card.style.display = ''; // Mostra o card (usa o display padrão do CSS)
        } else {
          card.style.display = 'none'; // Esconde o card
        }
      });
    }

    // Chamada inicial para renderizar a primeira página de imagens
    renderImages();

    imagePrevPageBtn.addEventListener('click', () => {
      if (currentImagePage > 1) {
        currentImagePage--;
        renderImages();
      }
    });

    imageNextPageBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredImageCards.length / imagesPerPage);
      if (currentImagePage < totalPages) {
        currentImagePage++;
        renderImages();
      }
    });
  }

  // 5. Lógica para Cores Metalizadas (Troca de Imagem para GIF)
  // Este bloco só será executado se estivermos na página de cores metalizadas
  const metalizedCards = document.querySelectorAll('.category-card.metalized-card');

  if (metalizedCards.length > 0 && document.body.classList.contains('metalized-colors-page')) {
    // Inicializa a paginação para cores metalizadas, se for o caso
    const metalizedGridContainer = document.querySelector('.category-grid');
    const metalizedPrevPageBtn = document.getElementById('prev-page-btn');
    const metalizedNextPageBtn = document.getElementById('next-page-btn');
    const metalizedPageInfoSpan = document.getElementById('page-info');

    const metalizedImagesPerPage = 12; // Ou a quantidade que desejar por página
    let currentMetalizedPage = 1;
    let allMetalizedCards = Array.from(metalizedCards); // Converte NodeList para Array
    let filteredMetalizedCards = allMetalizedCards; // Para uso futuro com filtros

    if (metalizedGridContainer && metalizedPrevPageBtn && metalizedNextPageBtn && metalizedPageInfoSpan && allMetalizedCards.length > 0) {
      function renderMetalizedImages() {
        const totalPages = Math.ceil(filteredMetalizedCards.length / metalizedImagesPerPage);
        metalizedPageInfoSpan.textContent = `Página ${currentMetalizedPage} de ${totalPages}`;

        metalizedPrevPageBtn.disabled = currentMetalizedPage === 1;
        metalizedNextPageBtn.disabled = currentMetalizedPage === totalPages || totalPages === 0;

        const startIndex = (currentMetalizedPage - 1) * metalizedImagesPerPage;
        const endIndex = startIndex + metalizedImagesPerPage;

        filteredMetalizedCards.forEach((card, index) => {
          if (index >= startIndex && index < endIndex) {
            card.style.display = ''; // Mostra o card
          } else {
            card.style.display = 'none'; // Esconde o card
          }
        });
      }

      renderMetalizedImages(); // Chamada inicial

      metalizedPrevPageBtn.addEventListener('click', () => {
        if (currentMetalizedPage > 1) {
          currentMetalizedPage--;
          renderMetalizedImages();
        }
      });

      metalizedNextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredMetalizedCards.length / metalizedImagesPerPage);
        if (currentMetalizedPage < totalPages) {
          currentMetalizedPage++;
          renderMetalizedImages();
        }
      });
    }

    // Lógica de troca de imagem para GIF ao passar o mouse
    metalizedCards.forEach((card) => {
      const img = card.querySelector('img');
      const staticSrc = img.src; // Armazena a imagem estática original
      const gifSrc = img.dataset.gifSrc; // Pega o caminho do GIF do data-attribute

      if (gifSrc) {
        // Apenas se houver um GIF definido
        // Evento mouseenter: troca para GIF
        card.addEventListener('mouseenter', () => {
          img.src = gifSrc;
        });

        // Evento mouseleave: volta para imagem estática
        card.addEventListener('mouseleave', () => {
          img.src = staticSrc;
        });
      }
    });
  }

  // 5. Lógica para o Acordeão do FAQ (geral)
  const faqQuestions = document.querySelectorAll('.faq-question');

  if (faqQuestions.length > 0) {
    faqQuestions.forEach((question) => {
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

  // 6. LÓGICA DO LIGHTBOX PARA PÁGINAS DE CATÁLOGO DE IMAGENS (geral)
  // A lógica para a lightbox deve estar sempre ativa, pois é usada em páginas de catálogo.
  const imageCardsLightbox = document.querySelectorAll('.category-card.image-card'); // Renomeado para evitar conflito de nome
  const lightboxOverlay = document.getElementById('lightboxOverlay');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxClose = document.getElementById('lightboxClose');

  if (imageCardsLightbox.length > 0 && lightboxOverlay && lightboxImage && lightboxClose) {
    imageCardsLightbox.forEach((card) => {
      card.addEventListener('click', () => {
        // CORREÇÃO: Pega a URL da imagem diretamente do src da tag <img>
        const imageUrl = card.querySelector('img').src;
        lightboxImage.src = imageUrl;
        lightboxOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });

    lightboxClose.addEventListener('click', () => {
      lightboxOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });

    lightboxOverlay.addEventListener('click', (event) => {
      if (event.target === lightboxOverlay) {
        lightboxOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && lightboxOverlay.classList.contains('active')) {
        lightboxOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
}); // Fim do DOMContentLoaded
