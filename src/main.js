import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";
import iziToast from "izitoast";
import "izitoast/dist/css/iziToast.min.css";
import { getSearch } from "./js/pixabay-api";
import { createMarkup } from "./js/render-functions";
import refs from "./js/refs";
const { form, gallery, loader, result, resultSpan } = refs;
import { scrollingTopPage } from "./js/scrollTop";


let saveQuery = '';
let currentPage = 1;
const perPage = 15;
let refreshPage;
let animItems;

loader.style.display = 'none';
result.style.display = 'none';

form.addEventListener('submit', onSearch);

scrollingTopPage();

function animOnScroll() {
    if (!animItems) return;
    const triger = window.innerHeight + 100;
    for (let index = 0; index < animItems.length; index++) {
        const animItem = animItems[index];
        const topOfBoxes = animItem.getBoundingClientRect().top;
        if (topOfBoxes < triger) {
            animItem.classList.add('show');
        }
    }
}

window.addEventListener('scroll', animOnScroll);

function onSearch(evt) {
    evt.preventDefault()
    currentPage = 1;
    gallery.innerHTML = '';
    loader.style.display = 'block';
    
    saveQuery = evt.target.elements.query.value.trim();

    window.addEventListener('scroll', infiniteScroll);

    if (saveQuery === '') {
        return iziToast.info({
            title: 'Hello',
            message: 'Please enter search text!',
        }),
            loader.style.display = 'none',
            result.style.display = 'none',
            form.reset()
    }


    getSearch(saveQuery, currentPage)
        .then(resp => {
            result.style.display = 'block';
            resultSpan.textContent = `${resp.data.totalHits}`;
            
            gallery.insertAdjacentHTML("beforeend", createMarkup(resp.data.hits));

            animItems = document.querySelectorAll('.gallery-item');
            animOnScroll();

            if (!resp.data.hits.length) {
                iziToast.error({
                    title: 'Error',
                    message: 'Sorry, there are no images matching your search query. Please try again!',
                }),
                    loader.style.display = 'none',
                    result.style.display = 'none';
                return;
            }

            loader.style.display = 'none';

            refreshPage = new SimpleLightbox('.gallery a', {
                captions: true,
                captionsData: 'alt',
                captionDelay: 250,
            });
            refreshPage.refresh();
        })
        .catch(err => {
            loader.style.display = 'none';
            console.log(`${err}`)
        });
    form.reset();
}

function infiniteScroll() {
    const documentRect = document.documentElement.getBoundingClientRect();

    // Проверяем, достиг ли пользователь конца страницы
    if (documentRect.bottom <= document.documentElement.clientHeight + 100) {  // Добавим небольшой отступ в 100 пикселей
        currentPage += 1;
        const getHeightImgCard = () => document.querySelector('.gallery-item').getBoundingClientRect();

        getSearch(saveQuery, currentPage).then(resp => {
            gallery.insertAdjacentHTML("beforeend", createMarkup(resp.data.hits));

            animItems = document.querySelectorAll('.gallery-item');
            animOnScroll();

            window.scrollBy({
                top: getHeightImgCard().height * 2,
                left: 0,
                behavior: "smooth",
            });
            refreshPage.refresh();

            // Проверяем, достигли ли конца всех результатов поиска
            if (currentPage * perPage >= resp.data.totalHits) {
                iziToast.info({
                    title: 'Caution',
                    message: `We're sorry, but you've reached the end of search results.`,
                });

                // Удаляем обработчик события, чтобы остановить бесконечную прокрутку
                window.removeEventListener('scroll', infiniteScroll);

                return;
            }
        }).catch(error => {
            console.error("Ошибка при загрузке результатов поиска:", error);
            iziToast.error({
                title: 'Error',
                message: 'Произошла ошибка при загрузке данных. Пожалуйста, попробуйте позже.',
            });
        });
    }
}
