let user_id_i = $('#data-template-icons').attr('user_id');
let docType_i = $('#data-template-icons').attr('doc_type');


let currentPage_i = 1; // Текущая страница
let totalPages_i  = 0 // Общее кол-во страниц
let isLoading_i = false; // Флаг для отслеживания загрузки данных

const prevBtnAttr_i = '[coll_'+docType_i+'="btn-page-prev"]'
const nextBtnAttr_i = '[coll_'+docType_i+'="btn-page-next"]'



$(document).ready(function () {


    function updateButtons() {
        if (currentPage_i === 1) {
            $('[coll_'+docType_i+'="btn-page-prev"]').prop('disabled', true);
        } else {
            $('[coll_'+docType_i+'="btn-page-prev"]').prop('disabled', false);
        }

        if (currentPage_i === totalPages_i || totalPages_i <= 1) {
            $('[coll_'+docType_i+'="btn-page-next"]').prop('disabled', true);
        } else {
            $('[coll_'+docType_i+'="btn-page-next"]').prop('disabled', false);
        }
    }

    function loadIconsData(pageNumber) {
        $('#my-ti_empty').remove()
        isLoading_i = true
        const gridContainer = $("#grid-container-icons");
        gridContainer.empty(); // Очищаем контейнер
        if (isLoading_i) {
            gridContainer.append(`
                <div id="loader-i" class="loader-ti"></div>
            `);
            $('[coll_'+docType_i+'="btn-page-next"]').prop('disabled', true);
            $('[coll_'+docType_i+'="btn-page-prev"]').prop('disabled', true);
        }
        return ($.ajax({
            url: 'coll_trophy_icons/coll_trophy_icons_controller.html',
            type: "POST",
            dataType: "JSON",
            data: JSON.stringify({
                mode: 'get_icon',
                pageNumber: pageNumber,
                userID: user_id_i,
                pageSize: 3
            }),
            beforeSend: function() {
                $('#loader-i').show()
            },
            complete: function() {
                $('#loader-i').hide();
            },
            async: true,
            error: (xhr, message) => {
                alert("SERVER ERROR\n" + message);
                isLoading_i = false
            },
            success: (data) => {
                if (data && data.success == false) {
                    return
                }


                // Если данных нет, добавляем кастомное уведомление
                if (!data.data.length) {
                    isLoading_i = false;
                    $('#loader-i').remove()
                    gridContainer.append(`
                        <div id="my-ti_empty">
                            <p>Значков пока нет.</p>
                        </div>
                    `);
                    gridContainer.css('max-height', '171px');
                }

    

                let elemList = $();
                totalPages_i = Math.ceil(data.totalPages);
                data.data.forEach(function (item) {
                    // let desc = item.description.replace(/"/g, '&quot;').replace(/<[^>]*>/g, '');
                    const gridItemIcons = `
                        <div class="grid-item-ti">
                         <div class="description" style="display:none;">${item.description}</div>
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
                    elemList = elemList.add($(gridItemIcons));
                    
                });

                if (elemList.length > 0) {              
                    gridContainer.append(elemList);
                    $(elemList).ready( function() {
                        elemList.each(function() {
                            
                            let description = $(this).find('.description');
                            let boxDiv = $(this).find('.boxDiv');
                            let text = description.text();
                            
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
                $('#loader-i').remove()
                isLoading_i = false
                updateButtons();
            },
        }))
    }



    // Загружаем данные при загрузке страницы
    loadIconsData(currentPage_i);
    
    // Обработчик для кнопки "Следующая"
    $('[coll_'+docType_i+'="btn-page-next"]').click(function() {
        currentPage_i += 1;
        loadIconsData(currentPage_i);
    });

    // Обработчик для кнопки "Предыдущая"
    $('[coll_'+docType_i+'="btn-page-prev"]').click(function() {
        if (currentPage_i > 1) {
            currentPage_i -= 1;
            loadIconsData(currentPage_i);
        }
    });
});