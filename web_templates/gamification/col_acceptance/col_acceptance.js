let user_id = $('#data-template').attr('user_id');
let docType = $('#data-template').attr('doc_type');

let currentPage = 1; // Текущая страница
let totalPages  = 0 // Общее кол-во страниц
let isLoading = false; // Флаг для отслеживания загрузки данных


$(document).ready(function () {

    function sendRequest(body, action, prop_name) {
        var response_data;
    
        $.ajax({
            url: '/coll_acceptance/coll_acceptance_controller.html',
            type: "POST",
            dataType: "JSON",
            data: JSON.stringify(body),
            async: false,
            error: (xhr, message) => {
                alert("SERVER ERROR\n" + message);
            },
            success: (data) => {
                response_data = data;
    
                if (prop_name) {
                    action(data[prop_name]);
                } else {
                    action(data);
                }
            }
        });
    
        return response_data;
    }
    function setLike(id, name, status, i, accCount){
        let newCount = 0
        sendRequest({ 
            mode: "set_like_for_acceptance",
            id: id,
            name: name,
            status: status,
        }, (data) => {
            if (data.success) {
                
                
            
                if(status == 0){
                    newCount = accCount + 1;
                    $('#like-acceptance-button'+i).attr('data-status', 1);
                    $('#like-img'+i).attr('src', '../icons/svg/like_on.svg');
                    $('#acc-count'+i).text(newCount);
                }else{
                    newCount = accCount - 1;
                    $('#like-acceptance-button'+i).attr('data-status', 0);
                    $('#like-img'+i).attr('src', '../icons/svg/like_off.svg');
                    $('#acc-count'+i).text(newCount);
                }
            } else {
                console.log("Ошибка", "Не удалось поставить лайк");
            }
        });
    }
    function updateButtons() {
        if (currentPage === 1) {
            $('[coll_acceptance="btn-page-prev"]').prop('disabled', true);
        } else {
            $('[coll_acceptance="btn-page-prev"]').prop('disabled', false);
        }

        if (currentPage === totalPages || totalPages <= 1 ) {
            $('[coll_acceptance="btn-page-next"]').prop('disabled', true);
        } else {
            $('[coll_acceptance="btn-page-next"]').prop('disabled', false);
        }
    }

    function loadData(pageNumber) {
        isLoading = true
        const gridContainer = $("#grid-container");
        gridContainer.empty(); // Очищаем контейнер
        if (isLoading) {
            gridContainer.append(`
                <span id="loader"></span>
            `);
            $('[coll_acceptance="btn-page-next"]').prop('disabled', true);
            $('[coll_acceptance="btn-page-prev"]').prop('disabled', true);
        }
        return ($.ajax({
            url: 'coll_acceptance/coll_acceptance_controller.html',
            type: "POST",
            dataType: "JSON",
            data: JSON.stringify({
                mode: 'get_acceptance',
                pageNumber: pageNumber,
                userID: user_id
            }),
            beforeSend: function() {
                $('#loader').show()
            },
            complete: function() {
                $('#loader').hide();
            },
            async: true,
            error: (xhr, message) => {
                alert("SERVER ERROR\n" + message);
                isLoading = false
            },
            success: (data) => {
                if (data && data.success == false) {
                    return
                }


            // Если данных нет, добавляем кастомное уведомление
                if (!data.length) {
                    isLoading = false;
                    $('#loader').remove()
                    gridContainer.append(`
                        <div id="my-acceptance_empty">
                            <p>Признаний пока нет.</p>
                        </div>
                    `);
                    gridContainer.css('height', '171px');
                }


                let elemList = $();
                totalPages = data[0].totalPages;
                if(data.length === 1)gridContainer.css('height', '100%');
                data.forEach(function (item) {
                    const gridItem = `
                        <div class="grid-item">
                            <div class="box-div-img"><img src="${item.pic_url}" class="box-icon" alt="${item.title}"></div>
                            <div class="box-div">
                                <span class="title-style">${item.fullname}</span>
                                <p style="text-align: left; margin:0;">${item.create_date}</p>
                                <div class="description" title="">${item.description}</div>
                            </div>
                            <div class="like-button-div">
                                <button class="like-acceptance-button" id="like-acceptance-button${item.RowNum}"
                                    data-id="${item.id}" data-name="${item.name}" data-status="${item.you_liked}" data-index="${item.RowNum}">
                                    <img style="width: auto !important; height: auto !important;" id="like-img${item.RowNum}" src="${item.you_liked == 1 ? '../icons/svg/like_on.svg' : '../icons/svg/like_off.svg'}"> 
                                 </button>
                                <span id="acc-count${item.RowNum}">${item.like_count}</span>
                            </div>
                        </div>
                    `;
                    elemList = elemList.add($(gridItem));
                    
                });

                if (elemList.length > 0) {
                    gridContainer.append(elemList);

                    $(elemList).ready( function() {
                        elemList.each(function() {
                            console.log('desc1 ', $(this).find('.description'));
                            
                            let childDesc = $(this).find('.description');
                            
                            let buttonLike = $(this).find('.like-acceptance-button');
                            if (childDesc[0].offsetHeight !== childDesc[0].scrollHeight) {
                                childDesc.css('cursor', 'pointer');
                                childDesc.hover(function() {
                                    let text = childDesc.text();
                                    childDesc.attr('title', text);
    
                                });
                            }
                            buttonLike.on('click', function() {
                                
                                const id = $(this).data('id');
                                const name = $(this).data('name');
                                const status = $(this).attr('data-status');
                                const index = $(this).data('index');
                                const accCount = parseInt($('#acc-count'+index).text(), 10);
                                      
                                
                                setLike(id, name, status, index, accCount);
                                
                                
                            });
                        });
                    });
                }

                // Больше не надо ничего запрашивать

                isLoading = false
                updateButtons();
            },
        }))
    }



    // Загружаем данные при загрузке страницы
    loadData(currentPage);
    
    // Обработчик для кнопки "Следующая"
    $('[coll_acceptance="btn-page-next"]').click(function() {
        currentPage += 1;
        loadData(currentPage);
    });

    // Обработчик для кнопки "Предыдущая"
    $('[coll_acceptance="btn-page-prev"]').click(function() {
        if (currentPage > 1) {
            currentPage -= 1;
            loadData(currentPage);
        }
    });
});