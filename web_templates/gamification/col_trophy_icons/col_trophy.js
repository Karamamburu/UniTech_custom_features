let user_id_t = $('#data-template-trophy').attr('user_id');
let docType_t = $('#data-template-trophy').attr('doc_type');


let currentPage_t = 1; // Текущая страница
let totalPages_t  = 0 // Общее кол-во страниц
let isLoading_t = false; // Флаг для отслеживания загрузки данных

const prevBtnAttr_t = '[coll_'+docType_t+'="btn-page-prev"]'
const nextBtnAttr_t = '[coll_'+docType_t+'="btn-page-next"]'


$(document).ready(function () {


    function updateButtons() {
        if (currentPage_t === 1) {
            $('[coll_'+docType_t+'="btn-page-prev"]').prop('disabled', true);
        } else {
            $('[coll_'+docType_t+'="btn-page-prev"]').prop('disabled', false);
        }

        if (currentPage_t === totalPages_t || totalPages_t <= 1) {
            $('[coll_'+docType_t+'="btn-page-next"]').prop('disabled', true);
        } else {
            $('[coll_'+docType_t+'="btn-page-next"]').prop('disabled', false);
        }
    }

    function loadTrophyData(pageNumber) {
        $('#my-ti_empty').remove()
        isLoading_t = true
        const gridContainer = $("#grid-container-trophy");
        gridContainer.empty(); // Очищаем контейнер
        if (isLoading_t) {
            gridContainer.append(`
                <div id="loader-t" class="loader-ti"></div>
            `);
            $('[coll_'+docType_t+'="btn-page-next"]').prop('disabled', true);
            $('[coll_'+docType_t+'="btn-page-prev"]').prop('disabled', true);
        }
        return ($.ajax({
            url: 'coll_trophy_icons/coll_trophy_icons_controller.html',
            type: "POST",
            dataType: "JSON",
            data: JSON.stringify({
                mode: 'get_trophy',
                pageNumber: pageNumber,
                userID: user_id_t,
                pageSize: 3
            }),
            beforeSend: function() {
                $('#loader-t').show()
            },
            complete: function() {
                $('#loader-t').hide();
            },
            async: true,
            error: (xhr, message) => {
                alert("SERVER ERROR\n" + message);
                isLoading_t = false
            },
            success: (data) => {
                if (data && data.success == false) {
                    return
                }

            // Если данных нет, добавляем кастомное уведомление
            if (!data.data.length) {
                isLoading_t = false;
                $('#loader-t').remove()
                gridContainer.append(`
                    <div id="my-ti_empty">
                        <p>Наград пока нет.</p>
                    </div>
                `);
                gridContainer.css('height', '171px');
            }

    

                let elemList = $();
                totalPages_t = data.totalPages;
                data.data.forEach(function (item) {
                    // let comment = item.comment.replace(/"/g, '&quot;').replace(/<[^>]*>/g, '');
                    const gridItem = `
                        <div class="grid-item-ti">
                            <div class="comment" style="display:none;">${item.comment}</div>
                            <div class="boxDiv" title="">
                                <div class="box-div-img-ti">
                                    <img src="${item.pic_url}" class="box-icon-ti" alt="${item.title}">
                                </div>
                                <div>
                                    <span class="title-style-ti">${item.name}</span>
                                </div>
                            </div>
                        </div>
                    `;
                    // <div class="comment" style="display:${item.comment?'block':'none'}">${item.comment}</div>
                    elemList = elemList.add($(gridItem));
                    
                });

                if (elemList.length > 0) {
                    gridContainer.append(elemList);
                    $(elemList).ready( function() {
                        elemList.each(function() {
                            
                            let comment = $(this).find('.comment');
                            let boxDiv = $(this).find('.boxDiv');
                            let text = comment.text();
                            
                            if (text != '') {
                                boxDiv.css('cursor', 'pointer');
                                boxDiv.hover(function() {
                                    boxDiv.attr('title', text);
    
                                });
                            }
                        });
                    });
                }

                // Больше не надо ничего запрашивать
                $('#loader-t').remove()
                isLoading_t = false
                updateButtons();
            },
        }))
    }



    // Загружаем данные при загрузке страницы
    loadTrophyData(currentPage_t);
    
    // Обработчик для кнопки "Следующая"
    $('[coll_'+docType_t+'="btn-page-next"]').click(function() {
        currentPage_t += 1;
        loadTrophyData(currentPage_t);
    });

    // Обработчик для кнопки "Предыдущая"
    $('[coll_'+docType_t+'="btn-page-prev"]').click(function() {
        if (currentPage_t > 1) {
            currentPage_t -= 1;
            loadTrophyData(currentPage_t);
        }
    });
});