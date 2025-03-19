DevExpress.localization.locale('ru');

let id_tab_gemification = 0;
let cur_user_id = 0;
let max_acceptance_amount = 150;

// Вкладки мои признания
let tabMyAcceptance = undefined;

let gridHistory = undefined;

let emptyImage = `
    <svg xmlns="http://www.w3.org/2000/svg" width="142" height="200" viewBox="0 0 142 200" fill="none">
        <rect width="142" height="200" rx="20" fill="#F1F1F1"/>
        <path d="M110.2 130.489V69.5112C110.2 64.72 106.28 60.8 101.489 60.8H40.5109C35.7198 60.8 31.7998 64.72 31.7998 69.5112V130.489C31.7998 135.28 35.7198 139.2 40.5109 139.2H101.489C106.28 139.2 110.2 135.28 110.2 130.489ZM55.7554 106.533L66.6442 119.644L81.8887 100L101.489 126.133H40.5109L55.7554 106.533Z" fill="#CACACA"/>
    </svg>`;

let newEntryImage = `
    <svg xmlns="http://www.w3.org/2000/svg" width="77" height="53" viewBox="0 0 77 53" fill="none">
        <path d="M7.97838 25.2726C6.86212 28.4225 4.13816 31.3046 1 32.7021C5.17018 32.3835 11.0744 33.2959 12.9629 36.8586C14.8514 40.4213 13.5878 45.186 13.314 49.2049C16.1292 46.2577 20.5732 42.0795 25.6841 43.296C30.795 44.5126 34.4316 52 34.4316 52C34.4316 52 38.4544 44.5488 45.1028 43.7667C52.8113 42.8616 55.3036 45.9463 58.7998 48.2056C58.9893 35.9607 63.4403 33.5276 76 31.1453C68.4179 29.4725 66.4521 25.9823 64.8163 22.5065C61.5308 15.5332 64.8023 11.4346 67.6877 6.95229C65.055 9.77637 59.7897 13.5491 54.2716 12.4049C46.6754 10.8336 45.531 6.68437 43.0317 1C42.2033 7.82124 40.0621 12.1515 36.4114 13.7446C29.8402 16.6193 24.287 11.8763 20.5661 6.05438C21.7596 9.64603 20.861 14.4615 17.5333 17.4738C13.8545 20.8048 8.68043 18.1255 6.0688 16.1414C6.0688 16.1414 9.01741 22.3109 7.97136 25.2581L7.97838 25.2726Z" fill="white" stroke="black" stroke-width="2" stroke-miterlimit="2"/>
        <path d="M43.3996 29.859L39.0614 21.9493L41.6206 21.3908L43.9115 26.3396L43.9776 26.3252L44.2129 20.825L46.2273 20.3854L48.7364 25.3039L48.8025 25.2895L48.8196 19.8196L51.3788 19.2611L50.7306 28.259L48.5346 28.7383L46.0675 24.3296L46.0015 24.344L45.5956 29.3797L43.3996 29.859Z" fill="black"/>
        <path d="M34.0236 31.9054L32.1786 23.4517L38.2712 22.1219L38.6748 23.9712L34.8772 24.8L35.1943 26.253L38.6782 25.4927L39.0818 27.3419L35.5979 28.1023L35.9151 29.5553L39.6961 28.7301L40.0997 30.5793L34.0236 31.9054Z" fill="black"/>
        <path d="M31.0907 23.6888L32.9357 32.1426L31.0204 32.5606L26.9965 28.7857L26.947 28.7965L27.9163 33.238L25.6212 33.7389L23.7762 25.2852L25.7246 24.8599L29.6954 28.6291L29.7614 28.6147L28.7957 24.1897L31.0907 23.6888Z" fill="black"/>
    </svg>`;

function isNotEmpty(value) {
    return value !== undefined && value !== null && value !== "";
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
function destItemTab() {
    $(document).off('scroll');
    destMyAcceptance();
    destHistory();
}

function destHistory() {
    if (gridHistory) {
        gridHistory.dispose();
    }
}

function destMyAcceptance() {
    if (tabMyAcceptance) {
        tabMyAcceptance.dispose();
    }
    $('#gamification-body #my-acceptance #content-gamification-body').children('#my-acceptance_acceptance, #my-acceptance_trophy, #my-acceptance_icon').empty();
}

function replaceEmptyText(text) {
    $('#my-acceptance_empty').html(text);
    $('#my-acceptance_empty .my-acceptance_redirect').on('click', () => $('#tab-gamification .dx-item')[1].click())
}

function sendRequest(body, action, prop_name) {
    var response_data;

    $.ajax({
        url: '/gamification/gamification_controller.html',
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

function refreshCurrentBalance() {
    sendRequest({mode: 'current_balance'}, (data) => {
        $('#acceptance_out_balance').html(data.acceptance_out_balance);
        $('#acceptance_in_balance').html(data.acceptance_in_balance);
    });
}

sendRequest({mode: 'cur_user_info'}, (data) => {
    cur_user_id = data.id;
})

sendRequest({
    mode: 'init_acceptance_list',
}, () => {});

// Основные вкладки геймификации
const tabsGemification = [
    {
      id: 0,
      text: 'Мои признания',
      updContent: () => updateMyAcceptance(),
      attr: '#my-acceptance'
    },
    {
      id: 1,
      text: 'Признать',
      updContent: () => makePresent(),
      attr: '#present'
    },
    {
      id: 2,
      text: 'История',
      updContent: () => updateHistory(),
      attr: '#history'
    },
    {
      id: 3,
      text: 'Магазин призов',
      updContent: () => window.location.replace('./shop'),
      attr: '#prize-shop',
      disabled: true
    },
];

const tab = $('#tab-gamification').dxTabs({
    width: 'auto',
    rtlEnabled: false,
    selectedIndex: 0,
    showNavButtons: false,
    dataSource: tabsGemification,
    stylingMode: 'secondary',
    onItemClick: (e) => {
        if (id_tab_gemification != e.itemIndex) {
            destItemTab();
            e.itemData.updContent();
            $('#gamification-body').children().hide();
            $('#gamification-body').children(e.itemData.attr).show();
            id_tab_gemification = Number(e.itemIndex);
        }
    },
    onContentReady: (e) => {
        tabsGemification[0].updContent();
    }
}).dxTabs('instance');

refreshCurrentBalance();

function updateMyAcceptance() {
    let id_tab_acceptance = -1;

    // Номер страницы
    let myAcceptance_acceptancePage = myAcceptance_trophyPage = myAcceptance_iconPage = 1;

    let myAcceptance_pageSize = 5 * 3;

    if (window.innerWidth > 1050) {
        myAcceptance_pageSize = 15;
    } else if (window.innerWidth > 800) {
        myAcceptance_pageSize = 12
    }
    // Не отправляем ещё один запрос
    let isLoading = false;

    // Больше не отправляем никаких запросов
    let shouldLoad = true;

    async function checkPosition(action) {
        let currentScroll = $(window).scrollTop();

        let totalHeight = $(document).height() - 30;
        let visibleHeight = $(window).height();

        if (totalHeight <= currentScroll + visibleHeight) {
            // Не отправляем новый запрос
            if (isLoading || !shouldLoad) return

            // Предотвращаем новые запросы
            isLoading = true

            return await action()
        }
    }

    function addEventScroll(action, elem) {
        $(document).on('scroll', function() {
            checkPosition(action)
        });

        if (elem.children().length > 0 && $(document).height() > $(window).height())
            return new Promise((res) => {res()})

        return checkPosition(action)
    }

    // Вкладки для Мои признания
    const tabsMyAcceptance = [
        {
            id: 0,
            text: 'Признания',
            icon: `<svg width="32" height="32" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M25.495 19.615C24.24 25.101 16.89 29.963 14.02 31.68a2.21 2.21 0 0 1-2.296 0C8.853 29.963 1.503 25.1.247 19.615c-1.135-4.953 1.744-10.1 6.62-10.174.1-.002.203-.002.306-.002 1.963 0 3.715 1.01 4.742 1.758.562.408 1.35.408 1.912 0 1.027-.747 2.779-1.758 4.742-1.758.103 0 .206 0 .306.002 4.876.074 7.755 5.22 6.62 10.174ZM31.901 4.064c-.505 2.191-3.458 4.133-4.611 4.819a.893.893 0 0 1-.922 0c-1.154-.686-4.107-2.628-4.612-4.819-.456-1.978.701-4.034 2.66-4.063L24.54 0c.789 0 1.493.404 1.906.702a.664.664 0 0 0 .767 0C27.625.404 28.33 0 29.118 0h.123c1.959.03 3.116 2.086 2.66 4.064Z"/>
            </svg>`,
            updContent: function(elem) {
                return addEventScroll(updateListAcceptance, elem)
            },
            attr: '#my-acceptance_acceptance'
        },
        {
            id: 1,
            text: 'Награды',
            icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M6.463.97h19.073c.794 0 1.444.567 1.546 1.31a3.928 3.928 0 0 1 1.979.126c1.302.443 2.137 1.545 2.561 2.846.835 2.558.303 6.391-1.766 10.488a1.204 1.204 0 0 1-1.608.53 1.181 1.181 0 0 1-.536-1.592c1.927-3.815 2.193-6.969 1.63-8.696-.275-.84-.689-1.206-1.06-1.331-.288-.099-.743-.117-1.39.148-.72 6.714-3.12 19.903-10.892 19.903-7.771 0-10.172-13.189-10.891-19.903-.648-.265-1.103-.247-1.392-.148-.37.125-.784.49-1.059 1.331-.563 1.727-.297 4.881 1.63 8.696a1.181 1.181 0 0 1-.536 1.592 1.204 1.204 0 0 1-1.608-.53C.075 11.642-.457 7.81.378 5.252.802 3.951 1.637 2.85 2.939 2.406a3.928 3.928 0 0 1 1.98-.127c.1-.742.751-1.31 1.544-1.31ZM16 25.364c-.328 0-.644-.033-.95-.097-.85-.177-1.815.017-2.275.747l-1.639 2.596c-.665 1.053.1 2.42 1.355 2.42h7.018c1.255 0 2.02-1.367 1.355-2.42l-1.639-2.596c-.46-.73-1.425-.924-2.275-.747a4.649 4.649 0 0 1-.95.097Z"/>
            </svg>`,
            updContent: function(elem) {
                return addEventScroll(updateListTrophy, elem)
            },
            attr: '#my-acceptance_trophy'
        },
        {
            id: 2,
            text: 'Значки',
            icon: `<svg width="32" height="32" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12.958 1.142c1.72-1.523 4.363-1.523 6.084 0a4.607 4.607 0 0 0 3.553 1.113c2.32-.256 4.458 1.242 4.922 3.449a4.352 4.352 0 0 0 2.196 2.915c2.033 1.107 2.85 3.53 1.88 5.58a4.199 4.199 0 0 0 0 3.603c.97 2.048.153 4.471-1.88 5.58a4.352 4.352 0 0 0-2.196 2.914c-.464 2.207-2.602 3.705-4.922 3.449a4.607 4.607 0 0 0-3.553 1.113c-1.72 1.523-4.363 1.523-6.084 0a4.606 4.606 0 0 0-3.553-1.113c-2.32.256-4.458-1.242-4.922-3.449a4.352 4.352 0 0 0-2.196-2.915c-2.033-1.108-2.85-3.53-1.88-5.58a4.198 4.198 0 0 0 0-3.603c-.97-2.048-.153-4.472 1.88-5.58a4.353 4.353 0 0 0 2.196-2.914c.464-2.207 2.602-3.705 4.922-3.449a4.607 4.607 0 0 0 3.553-1.113Zm5.405 8.277c.251 0 .455.196.455.439v11.886a.447.447 0 0 1-.455.438H16.08a.447.447 0 0 1-.455-.438v-9.387a.06.06 0 0 0-.06-.059.062.062 0 0 0-.032.009l-2.253 1.328c-.303.179-.692-.032-.692-.374V11.62c0-.152.081-.293.215-.373l2.938-1.762a.467.467 0 0 1 .24-.066h2.382Z"/>
            </svg>`,
            updContent: function(elem) {
                return addEventScroll(updateListIcon, elem)
            },
            attr: '#my-acceptance_icon'
        }
    ];

    tabMyAcceptance = $('#tab-acceptance').dxTabs({
        width: 'auto',
        rtlEnabled: false,
        selectedIndex: 0,
        showNavButtons: false,
        dataSource: tabsMyAcceptance,
        stylingMode: 'secondary',
        iconPosition: 'start',
        onItemClick: (e) => {
            if (id_tab_acceptance != e.itemIndex) {
                $(document).off('scroll');
                isLoading = false;
                shouldLoad = true;
                $('#content-gamification-body').children().hide();

                e.itemData.updContent($(e.itemData.attr)).then(async () => {
                    if ($(e.itemData.attr).children().length > 0) {
                        $('#content-gamification-body').children(e.itemData.attr).show();
                    } else {
                        empty_message = '';
                        switch(e.itemIndex) {
                            case 0:
                                empty_message = `<p>Пока здесь нет наград. Новые достижения впереди, вместе, в команде Rostic\`s.</p>`;
                                break;
                            case 1:
                                empty_message = `<p>Пока здесь нет наград. Новые достижения впереди, вместе, в команде Rostic\`s.</p><label>Перейти в раздел <label class="my-acceptance_redirect">Признать</label>.</label>`;
                                break;
                            case 2:
                                empty_message = `<p>Пока здесь нет значков. Участвуй в мероприятиях Rostic's и они непременно появятся!</p><label>Начни с <label class="my-acceptance_redirect">признания</label> коллег!</label>`;
                                break;
                            default:
                                empty_message = `<p>Пока здесь нет наград. Новые достижения впереди, вместе, в команде Rostic\`s.</p>`;
                                break;
                        }
                        replaceEmptyText(empty_message);
                        $('#my-acceptance_empty').show();
                    }

                    id_tab_acceptance = Number(e.itemIndex);
                    while ($(document).height() <= $(window).height() && shouldLoad) {
                        await e.itemData.updContent($(e.itemData.attr))
                    }
                });
            }
        },
        onContentReady: (e) => {
            // Добавление показателя количества элементов в вкладке
            $("#tab-acceptance .dx-tab").append('<div class="my-acceptance-amount">0</div>');
            $.ajax({
                url: 'gamification/gamification_controller.html',
                type: "POST",
                dataType: "JSON",
                data: JSON.stringify({
                    mode: 'count_acceptance'
                }),
                async: false,
                error: (xhr, message) => {
                    alert("SERVER ERROR\n" + message);
                },
                success: (data) => {
                    let countTabs = $("#tab-acceptance .dx-tab .my-acceptance-amount");
                    countTabs[0].innerHTML = data.countAcceptances;
                    countTabs[1].innerHTML = data.countRewards;
                    countTabs[2].innerHTML = data.countIcons;
                }
            });
        }
    }).dxTabs('instance');

    replaceEmptyText(`<p>Пока здесь нет наград. Новые достижения впереди, вместе, в команде Rostic\`s.</p>`);
    // Отрисовка первой вкладки
    tabMyAcceptance.option("onItemClick")({itemData:tabsMyAcceptance[0]});

    function updateListAcceptance() {
        return ($.ajax({
            url: 'gamification/gamification_controller.html',
            type: "POST",
            dataType: "JSON",
            data: JSON.stringify({
                mode: 'get_acceptance',
                pageNumber: myAcceptance_acceptancePage
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

                let elemList = $();
                data.forEach((postData, i) => {
                    if (!postData) return;

                    let image = postData.pic_url ? `<img src="${postData.pic_url}" alt="">` : emptyImage;

                    let elem = `
                        <div class="my-acceptance-elem">
                            <div class="new-entry" style="display:${postData.new_entry ? 'block' : 'none'}">
                                ${newEntryImage}
                            </div>
                            <div class="my-acceptance-img">
                                ${image}
                            </div>
                            <div class="my-acceptance-content">
                                <div class="author-fullname">${postData.fullname}</div>
                                <div class="date-create">${postData.create_date}</div>
                                <div class="description">${postData.description}</div>
                                <div class="button-read-more" style="display:none">Читать</div>
                            </div>
                            <div class="like-acceptance">
                                <button class="like-acceptance-button" id="like-acceptance-button${postData.RowNum}"
                                data-id="${postData.id}" data-name="${postData.name}" data-status="${postData.you_liked}" data-index="${postData.RowNum}"
                                >
                                <img id="like-img${postData.RowNum}" src="${postData.you_liked == 1 ? '../icons/svg/like_on.svg' : '../icons/svg/like_off.svg'}">
                                
                                </button>
                                <span id="acc-count${postData.RowNum}">${postData.like_count}</span>
                            </div>
                        </div>
                    `;
                    elemList = elemList.add($(elem));
                });

                if (elemList.length > 0) {
                    $('#my-acceptance_acceptance').append(elemList);

                    $(elemList).ready( function() {
                        elemList.each(function() {
                            let childDesc = $(this).find('.description');
                            let buttonReadMore = $(this).find('.button-read-more');
                            let buttonLike = $(this).find('.like-acceptance-button');
                            buttonLike.on('click', function() {
                                const id = $(this).data('id');
                                const name = $(this).data('name');
                                const status = $(this).attr('data-status');
                                const index = $(this).data('index');
                                const accCount = parseInt($('#acc-count'+index).text(), 10);
                                setLike(id, name, status, index, accCount);
                            });

                            if (childDesc[0].offsetHeight !== childDesc[0].scrollHeight) {
                                buttonReadMore.show();

                                buttonReadMore.on('click', function() {
                                    if (childDesc[0].style.display == '') {
                                        childDesc.css('display', 'block');
                                        buttonReadMore.text('свернуть');
                                    } else {
                                        childDesc.css('display', '');
                                        buttonReadMore.text('читать');
                                    }
                                });
                            }
                        });
                    });
                }

                // Больше не надо ничего запрашивать
                if (data.length == 0)  {
                    shouldLoad = false
                } else myAcceptance_acceptancePage++;

                isLoading = false
            },
        }))
    }


    function updateListTrophy() {
        return ($.ajax({
            url: 'gamification/gamification_controller.html',
            type: "POST",
            dataType: "JSON",
            data: JSON.stringify({
                mode: 'get_trophy',
                pageNumber: myAcceptance_trophyPage,
                pageSize: myAcceptance_pageSize,
            }),
            beforeSend: function() {
                $('#loader').show()
            },
            complete: function() {
                $('#loader').hide();
                isLoading = false
            },
            async: true,
            error: (xhr, message) => {
                alert("SERVER ERROR\n" + message);
            },
            success: (data) => {
                if (data && data.success == false) {
                    return
                }

                data.forEach((postData) => {
                    // Если данных нет, ничего не делаем
                    if (!postData) return

                    let image = postData.pic_url ? `<img src="${postData.pic_url}" alt="">` : emptyImage;

                    $('#my-acceptance_trophy').append(
                        `<div class="my-acceptance-wrapper">
                            <div class="my-acceptance-elem">
                                <div class="new-entry" style=display:${postData.new_entry ? 'block' : 'none' }>
                                    ${newEntryImage}
                                </div>
                                <div class="my-trophy-img">
                                    ${image}
                                </div>
                                <div class="my-acceptance-content">
                                    <div class="name-trophy">${postData.name}</div>
                                </div>
                                <div class="amount-coming" style="display:${postData.amount_coming?'block':'none'}">+${postData.amount_coming}</div>
                            </div>
                            <div class="comment" style="display:${postData.comment?'block':'none'}">${postData.comment}</div>
                        </div>`
                    )
                });

                if (data.length == 0)  {
                    shouldLoad = false;
                } else myAcceptance_trophyPage++;
            }
        }))
    }

    function updateListIcon() {
        return $.ajax({
            url: 'gamification/gamification_controller.html',
            type: "POST",
            dataType: "JSON",
            data: JSON.stringify({
                mode: 'get_icon',
                pageNumber: myAcceptance_iconPage,
                pageSize: myAcceptance_pageSize,
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
                isLoading = false;
            },
            success: (data) => {
                if (data && data.success == false) {
                    return
                }

                data.forEach((postData) => {
                    // Если данных нет, ничего не делаем
                    if (!postData) return

                    let image = postData.pic_url ? `<img src="${postData.pic_url}" alt="">` : emptyImage;

                    $('#my-acceptance_icon').append(
                        `<div class="my-acceptance-wrapper">
                            <div class="my-acceptance-elem">
                                <div class="new-entry" style=display:${postData.new_entry ? 'block' : 'none' }>
                                    ${newEntryImage}
                                </div>
                                <div class="my-icon-img">
                                    ${image}
                                </div>
                                <div class="my-acceptance-content">
                                    <div class="name-icon">${postData.name}</div>
                                </div>
                            </div>
                            <div class="comment" style="display:${postData.description?'block':'none'}">${postData.description}</div>
                        </div>`
                    )
                });

                if (data.length == 0)  {
                    shouldLoad = false;
                } else myAcceptance_iconPage++;

                isLoading = false
            }
        })
    }

}

function updateHistory() {

    function isNotEmpty(value) {
        return value !== undefined && value !== null && value !== "";
    }

    let columns = [];
    $.ajax({
        url: 'gamification/gamification_controller.html',
        type: "POST",
        dataType: "JSON",
        data: JSON.stringify({
            mode: 'history_columns'
        }),
        async: false,
        error: (xhr, message) => {
            console.error("Ответ сервера:", xhr.responseText);
            alert("SERVER ERROR\n" + message);
        },
        success: (data) => {
            columns = data;

            columns.forEach(column => {
                if (column.dataField === 'pic_url') {
                    column.cellTemplate = function (container, options) {
                        if (options.value) {
                            icon = $("<div>").css({
                                "background-image": `url(${options.value})`,
                                "background-size": "cover",
                                "background-position": "center"
                            }).appendTo(container);

                            icon.attr('class', 'history-icon');


                        } else {
                            container.text("");
                        }
                    };
                }
            });
        }
    });

    let currentSkip = 0;  // Начальная точка пропуска
    let currentTake = 10; // Количество строк для загрузки
    let allData = [];     // Массив для хранения всех данных
    let isLoading = false; // Флаг для отслеживания загрузки данных
    let isAllData = false;

    // Инициализация источника данных для DataGrid
    let store = new DevExpress.data.CustomStore({
        key: "id",
        load: function(loadOptions) {
            var deferred = $.Deferred();

            $.ajax({
                url: 'gamification/gamification_controller.html',
                dataType: "json",
                type: 'POST',
                data: JSON.stringify({
                    mode: 'history_catalog',
                    skip: currentSkip,
                    take: currentTake
                }),
                success: function(result) {
                    let postProcData = postprocessing(result.data);
                    deferred.resolve({ data: postProcData, totalCount: result.totalCount });
                    if (result.totalCount < (currentSkip + currentTake)) {
                        isAllData = true;
                    }
                },
                error: function() {
                    deferred.reject("Data Loading Error");
                    isAllData = true;
                }
            });

            return deferred.promise();
        }
    });

    // Инициализация таблицы и предзагрузка данных
    gridHistory = $("#tab-hist").dxDataGrid({
        dataSource: store,
        remoteOperations: true,
        columnsAutoWidth: true,
        showBorders: true,
        noDataText: "",
        columnResizingMode: "widget",
        showColumnHeaders: false,
        allowColumnResizing: false,
        editing: {
            allowUpdating: false
        },
        columns: columns,
        paging: {
            enabled: false
        },
        pager: {
            visible: false
        },
        loadPanel: {
            enabled: false
        },
        onCellPrepared: function(e) {
            if (e.column.dataField == 'score') {
                if (e.data.user_is_sender) {
                    e.cellElement[0].className = 'history-score-out';
                } else {
                    e.cellElement[0].className = 'history-score-in';
                }
            }
        },
        onContentReady: function(e) {
            isScrolling = false;
            const gridElement = e.element;
            const noDataElement = gridElement.find(".custom-no-data");
            noDataElement.remove();

            // Если данных нет, добавляем кастомное уведомление
            if (!e.component.getDataSource().items().length) {
                console.log(!e.component.getDataSource());
                gridElement.append(`
                    <div id="my-acceptance_empty">
                        <p>Упс! Пока никто не подарил тебе признание, но ты уже сейчас можешь это сделать для своего коллеги!</p>
                        <label>Просто перейди в раздел
                            <label class="my-acceptance_redirect">«Признать»</label>!
                        </label>
                    </div>
                `);

                $('#my-acceptance_empty .my-acceptance_redirect').on('click', () => $('#tab-gamification .dx-item')[1].click())
            }
        }
    }).dxDataGrid('instance');

    // Функция для предзагрузки данных при загрузке страницы (до скроллинга)
    async function preLoadData() {
        if (!isLoading) {
            isLoading = true;
            //currentSkip += currentTake; // Увеличиваем пропуск

            // Загружаем первые данные, чтобы начать их показывать до скроллинга
            try {
                let newData = await store.load();
                if (newData && newData.data && newData.data.length > 0) {
                    allData = allData.concat(newData.data); // Добавляем данные в общий массив

                    // Обновляем источник данных для dataGrid
                    gridHistory.option('dataSource', {
                        store: new DevExpress.data.ArrayStore({
                            key: "id",
                            data: allData
                        })
                    });
                }
            } catch (error) {
                console.error("Ошибка при загрузке данных", error);
            } finally {
                isLoading = false;
            }

            currentSkip += currentTake; // Увеличиваем пропуск
        }
    }

    // Вызов функции предзагрузки данных при старте страницы
    $(document).ready(function() {
        async function loadUntilReady() {
            while ($(document).height() <= $(window).height() && !isLoading && !isAllData) {
                await preLoadData();
                // Задержка в 200 миллисекунд между загрузками, чтобы не блокировать UI
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        loadUntilReady(); // Запуск асинхронной предзагрузки
    });

    // Добавляем обработчик скролла
    $(window).scroll(function() {
        let scrollTop = $(window).scrollTop(); // Текущая позиция прокрутки
        let documentHeight = $(document).height(); // Полная высота документа
        let windowHeight = $(window).height(); // Высота окна

        // Проверяем, если прокрутка достигла низа страницы
        if (!isLoading && scrollTop + windowHeight >= documentHeight - 100) {
            handleScrollNearBottom();
        }
    });

    // Функция для обработки загрузки данных при достижении низа страницы
    function handleScrollNearBottom() {
        if (isLoading) return; // Если данные уже загружаются, не начинаем загрузку

        isLoading = true;

        // Загружаем новые данные
        store.load().done(function(newData) {
            if (newData && newData.data && newData.data.length > 0) {
                allData = allData.concat(newData.data); // Добавляем новые данные в общий массив

                // Обновляем источник данных для dataGrid
                gridHistory.option('dataSource', {
                    store: new DevExpress.data.ArrayStore({
                        key: "id",
                        data: allData
                    })
                });
            }
        }).fail(function() {
            console.error("Ошибка при загрузке данных");
        }).always(function() {
            isLoading = false;
        });

        currentSkip += currentTake; // Увеличиваем пропуск
    }

    // Функция для обработки данных перед их отображением
    function postprocessing(data) {
        let result = [];
        if (data.length == 0) return result;

        result = data.map((column) => {
            let newObj = {};
            newObj.id = column.id;
            newObj.assign_date = isNotEmpty(column.assign_date) ? column.assign_date : 'Нет даты';
            newObj.pic_url = isNotEmpty(column.pic_url) ? column.pic_url : '';
            newObj.user_is_sender = column.user_is_sender;
            if (column.user_is_sender) {
                item_type_str = column.item_type === 'qualification_assignment' ? 'награду' : column.item_type === 'assign_icon' ? 'значок' : 'признание';
                newObj.from = `Вы отправили ${item_type_str} ${column.person_fullname}`;
                newObj.score = '';
                if (column.item_type == 'acceptance') {
                    newObj.score = `${isNotEmpty(column.amount) ? '-'+column.amount : ''} `;
                }
            } else {
                item_type_str = column.item_type === 'qualification_assignment' ? 'Награда' : column.item_type === 'assign_icon' ? 'Значок' : 'Признание'
                newObj.from = `${item_type_str} от ${isNotEmpty(column.sender_fullname) ? column.sender_fullname : 'неизвестно'}`;
                newObj.score = `${isNotEmpty(column.amount) ? '+'+column.amount : ''} `;
            }

            return newObj;
        });

        return result;
    }
}

function makePresent() {
    const collaboratorsIds = {
        success: false,
        data: "",
    };
    // Получение списка сотрудников для выбора получателя признания, выборка производится по условию - первые 3 символа логина содержат буквы, остальные 4 символа цифры.
    sendRequest({ mode: "get_coll_list_for_choose" }, (data) => {
        if (data.success) {
            collaboratorsIds.success = true;
            collaboratorsIds.data = data.collList;
        } else {
            showWindow("Ошибка", "Не удалось загрузить список сотрудников для выбора получателей признания. Попробуйте перезагрузить страницу.");
        }
    });
    let selectedOptions = {};

    function checkDate() {
        const result = {
            is_sucssess: false,
            error: true,
            message: 'Нет действия'
        }
        if (selectedOptions.recipient_id === '') return { ...result, message: 'Не выбран получатель' }
        if (selectedOptions.type === '') return { ...result, message: 'Не выбрано признание' }
        if (selectedOptions.resource_id === '') return { ...result, message: 'Не указан ресурс базы' }

        switch (selectedOptions.type) {
            case 'acceptance':
                if (selectedOptions.sender_id === '') return { ...result, message: 'Не указан отправитель' };
                if ( selectedOptions.is_paing && selectedOptions.amount === 0) return { ...result, message: 'Не введена сумма признания' };
                if (selectedOptions.amount > selectedOptions.balans_limit) return { ...result, message: 'Сумма превышает лимит счета' };
                break;
            case 'trophy':
                if (selectedOptions.sender_id === '') return { ...result, message: 'Не указан отправитель' };
                break;
            case 'icon':
                break;
            default:
                return { ...result, message: 'Неизвестная ошибка' };
        }
        return { is_sucssess: true, error: false, message: '' }
    }

    function showWindow(title, message, restsrtApp, needRestart) {
        var $overLay = $('#dialog_background_overlay');
        $overLay.css('display', 'block');
        const dialogContainer = $('<div id="ui_dialog"></div>');
        $overLay.append(dialogContainer);
        let tabsContainer = `<div class="message__container">${message}</div>`
        dialogContainer.append(tabsContainer);
        dialogContainer.dialog({
            position: {
                my: "center",
                at: "center",
                of: $('.viewport')
            },
            title: title,
            resizable: false,
            draggable: false,
            width: ($(window).width() <= 900 ? '95%' : '50%'),
            height: 'auto',
            dialogClass: "wt-lp-dialog",
            buttons: [{
                text: 'Закрыть',
                class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
                click: () => {
                    $('#ui_dialog').remove();
                    $('#dialog_background_overlay').css('display', 'none');
                    if (needRestart) restsrtApp()
                }
            }],
            close: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
                if (needRestart) restsrtApp()
            },
            open: () => {
                $('#dialog_background_overlay').css('display', 'block');
            }
        });

        jDialog = $('div.ui-dialog');
        jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
    }

    function sucssessReq() {
        showWindow('', `<img class='acceptance-sended-img' src='/images/acceptance_success_sended.png'/>
                    <div style='margin-top: 2em;'>Ты отправил признание!</div>`, () => {
            createHtml()
            restatrData()
        }, true );
        refreshCurrentBalance();
    }

    function sendGift() {
        if (!selectedOptions.recipient_id || !selectedOptions.recipient_id.length) {
            item_type_str = selectedOptions.type === 'trophy' ? 'награды' : selectedOptions.type === 'icon' ? 'значка' : 'признания';
            showWindow(`Отправка ${item_type_str}`, `<div>Не указан(ы) получатели ${item_type_str}.</div>`);
            return;
        }

        if (!selectedOptions.type) {
            showWindow(`Отправка признания`, `<div>Не выбрано признание.</div>`);
            return;
        }

        let action = checkDate()
        if (action.is_sucssess) {
            switch (selectedOptions.type) {
                case 'acceptance':
                    if (!selectedOptions.description) {
                        showWindow('Отправка признания', `<div>Не заполнен текст признания.</div>`)
                        return;
                    }

                    if (selectedOptions.amount > max_acceptance_amount) {
                        showWindow(`Отправка признания`, `<div>Вы можете отправить максимум ${max_acceptance_amount} признаний одновременно.</div>`);
                        return;
                    }

                    sendRequest({
                        mode: 'give_acceptance',
                        recipients: selectedOptions.recipient_id,
                        is_personal: selectedOptions.is_personal,
                        amount: selectedOptions.amount,
                        resource_id: selectedOptions.resource_id,
                        description: selectedOptions.description,
                    }, (data) => {
                        if (data.success) {
                            sucssessReq()
                        } else {
                            let message = `Признания не отправились следующим пользователям:<br><br>${data.description.join('<br><br>')}`;
                            showWindow('Вы отправили признание', message, () => {}, false );
                        }
                    })
                    break;
                case 'trophy':
                    sendRequest({
                        mode: 'give_trophy',
                        recipients: selectedOptions.recipient_id,
                        qualificationId: selectedOptions.resource_id,
                    }, (data) => {
                        if (data.success) {
                            sucssessReq()
                        } else {
                            let message = `Награда не отправилась следующим пользователям:<br><br>${data.description.join('<br><br>')}`;
                            showWindow('Вы отправили награду', message, () => {}, false );
                        }
                    })
                    break;
                case 'icon':
                    sendRequest({
                        mode: 'give_icon',
                        recipients: selectedOptions.recipient_id,
                        iconId: selectedOptions.resource_id,
                    }, (data) => {
                        if (data.success) {
                            sucssessReq()
                        } else {
                            let message = `Значок не отправился следующим пользователям:<br><br>${data.description.join('<br><br>')}`;
                            showWindow('Вы отправили значок', message, () => {}, false );
                        }
                    })
                    break;

                default:
                    showWindow('Ошибка', 'Неизвестная ошибка', () => {}, false )
                    break;
            }
        } else {
            showWindow(action.message, () => {}, false )
        }
    }

    function clearAdditionalFields() {
        $('#additional-panel').find('textarea').val('');
        $('#additional-panel').find('input[type="checkbox"]').prop('checked', false);
        $('#additional-panel').find('select').prop('selectedIndex', 0);
        selectedOptions.amount = 0;
        selectedOptions.description = '';
        selectedOptions.is_personal = false;
    }

    function checkAdditionalFields() {
        let $additionPanel = $('#additional-panel');
        if (selectedOptions.type === 'acceptance') {
            $additionPanel.css('display', 'block');
        } else {
            $additionPanel.css('display', 'none');
            clearAdditionalFields()
        }
    }

    function setGift(resource_id, picUrl, picName, type) {
        selectedOptions = { ...selectedOptions, type, resource_id };
        const $container = $('.choosen-option').addClass('choosen-option_img');

        $container.empty().append(`
            <div class="present__choosen-img-container">
                <div class="present__choosen-img" style="background-image: url(${picUrl})"></div>
                <p class="choosen-option__attention">${picName}</p>
            </div>
        `);

        checkAdditionalFields();
    }

    function selectGifts(allGifts) {
        var $overLay = $('#dialog_background_overlay');
        $overLay.css('display', 'block');

        const dialogContainer = $('<div id="ui_dialog" class="wt-lp-dialog-body"></div>');
        $overLay.append(dialogContainer);

        let tabsContainer = '<div class="gift-container">';
        let contentContainer = '<div id="tab_content" class="gift-container__content">';

        if (allGifts.acceptance && allGifts.acceptance.length > 0) {
            tabsContainer += '<button class="gift-container__tab" data-tab="1">Признания</button>';
            contentContainer += generateTabContent(allGifts.acceptance, 'acceptance', 'Признания');
        }

        if (allGifts.trophys && allGifts.trophys.length > 0) {
            tabsContainer += '<button class="gift-container__tab" data-tab="2">Награды</button>';
            contentContainer += generateTabContent(allGifts.trophys, 'trophy', 'Награды');
        }

        if (allGifts.icons && allGifts.icons.length > 0) {
            tabsContainer += '<button class="gift-container__tab" data-tab="3">Значки</button>';
            contentContainer += generateTabContent(allGifts.icons, 'icon', 'Значки');
        }

        tabsContainer += '</div>';
        contentContainer += '</div>';

        dialogContainer.append(tabsContainer);
        dialogContainer.append(contentContainer);

        $(document).on('click', '.gift-container__tab', function () {
            $('.gift-container__tab').removeClass('gift-container__tab_active');
            $(this).addClass('gift-container__tab_active');
            $('.gift-container__tab-content').hide();
            $(`.gift-container__tab-content[data-tab-name="${$(this).text()}"]`).show();
        });


        $(document).on('click', '.gift-container__item', function () {
            const giftId = $(this).data('id');
            const picUrl = $(this).data('picurl');
            const picName = $(this).data('name');
            const type = $(this).data('type');
            setGift(giftId, picUrl, picName, type);
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        });

        $('.gift-container__tab').first().addClass('gift-container__tab_active');
        $('.gift-container__tab-content').hide();
        $('.gift-container__tab-content').first().show();

        dialogContainer.dialog({
            resizable: false,
            draggable: false,
            title: 'Выбрать признание',
            width: ($(window).width() <= 900 ? '95%' : '70%'),
            height: 'auto',
            dialogClass: "wt-lp-dialog",
            buttons: [{
                text: 'Закрыть',
                class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
                click: () => {
                    $('#ui_dialog').remove();
                    $('#dialog_background_overlay').css('display', 'none');
                }
            }],
            close: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            },
            open: () => {
                $('#dialog_background_overlay').css('display', 'block');
            }
        });

        dialogContainer.dialog('open');

        jDialog = $('div.ui-dialog');
        jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
    }

    function generateTabContent(items, tabIndex, tabName) {
        let content = `<div class="gift-container__tab-content" data-tab-name="${tabName}">`;
        items.forEach(item => {
            content += `
                <div class="gift-container__item" data-type="${tabIndex}" data-id="${item.id}" data-picurl="${item.pic_url}" data-name="${item.name}">
                    <div class="${(tabIndex == 'acceptance' ? 'gift-container-acceptance__img' : 'gift-container__img')}" style="background-image: url(${item.pic_url});"></div>
                    <p class="gift-container__title">${item.name}</p>
                </div>
            `;
        });
        content += '</div>';
        return content;
    }

    function setColl(oChoosenColl) {
        console.log(oChoosenColl)
        var recipients = [];
        for (i = 0; i < oChoosenColl.elemArray.length; i++) {
            recipient = {
                id: oChoosenColl.elemArray[i],
                fullname: oChoosenColl.elemNamesArray[i]
            };

            recipients.push(recipient);
        }
        selectedOptions.recipient_id = recipients;
        $('#selected_colls').text(oChoosenColl.elemNamesArray.join(', '));
        $('#selected_colls').attr('title', oChoosenColl.elemNamesArray.join(', '));
        if (!selectedOptions.resource_id) {
            $('.choosen-option__attention').text('Для отправки выберите признание');
        }
    }

    function addStyleToIframe() {
            const iframe = document.querySelector(".wt-x-show-dialog-frame");

            // Ждем загрузки iframe
            iframe.addEventListener("load", () => {
                // Проверяем, доступен ли документ iframe
                if (iframe.contentDocument) {
                    // Получаем доступ к документу внутри iframe
                    const iframeDocument = iframe.contentDocument;

                    const styleElement = document.createElement("style");
                    styleElement.textContent = `.icon-arrow-right-ico:before, .cssXPLink.icon-arrow-right:before, .cssXPLabel.icon-arrow-right:before, .cssXPButton.icon-arrow-right > .x-btn-wrap > .x-btn-button > .x-btn-icon-el:before, .cssXPTabItem-title.icon-arrow-right-title > .x-tab-wrap > .x-tab-button > .x-tab-icon-el:before {
						content: "\\f002" !important;
					}`;

                    // Добавляем элемент <style> в <head> документа iframe
                    iframeDocument.head.appendChild(styleElement);
                } else {
                    console.error("Не удалось получить доступ к документу iframe.");
                }
            });
    }
	
    function show(field, title, catalog, disp_object_ids, m_sel, xquery_filter) {
        var pars = new Object();
        pars.title = title;

        xShowDialog('dlg_select_inline.html',
            {
                "catalog_name": catalog,
                "multi_select": m_sel,
                "can_be_empty": "true",
                "xquery_qual": xquery_filter,
                "disp_filter": "false",
                "check_access": "false",
                "display_object_ids": disp_object_ids
            },
            {
                height: 750,
                width: 1150,
                minHeight: 850,
                minWidth: 650,
                after_open: function () {
                    getElems();
                    setDivHeight();
                    $(".ui-dialog-title").prepend("<div style='text-align: left; display: inline-block; font-weight: bold'>" + title + "</div><style>.ui-dialog-title {text-align: left;}</style>");
					addStyleToIframe();
                },
                resizeStop: function (event, ui) {
                    setDivHeight();
                }
            },
            function (oParams) {
                if (!oParams.handle) return null;
                setColl(oParams);
            }
        );
    }

    function createHtml() {

        $('#present').empty();
        $('#present').append('<div class="tab-present" id="tab-present"></div>');

        const htmlContent = `
        <h5 class="present__title">Выбранные сотрудники:</h5>
        <div class="present__recipient">
            <div class="present__select_colls_container">
                <button id="select_colls" class="present__select_colls"></button>
                <div id="selected_colls" class="present__selected_colls"></div>
            </div>
            <div class="present__choose-container">
                <button class="present__submit-button" id="select_gifts">Выбрать признание</button>
            </div>
        </div>
        <h5 class="present__title">Выбранное признание:</h5>
        <div class="choosen-option">
            <p class="choosen-option__attention">Для отправки выберите сотрудника и признание</p>
        </div>
        <div id="additional-panel" style="display: none;">
            <h5 class="present__title">Текст признания</h5>
            <div class="present__text">
                <textarea id="recognition-text" class="present__textarea"></textarea>
            </div>
            <div class="present__options">
                <div class="present__option">
                    <input type="checkbox" class="present__checkbox" id="publick-check" checked>
                    <div>Сделать признание публичным</div>
                </div>
                <div class="present__option_amount">
                    <div class="present__option_amount_container">
                        <input type="checkbox" class="present__checkbox" id="is-send-amount">
                        <div class="checkbox_title">Передать баллы</div>
                    </div>
                    <input type="number" placeholder="Сумма" class="present__input-text" id="amount-count" disabled>
                </div>
            </div>
        </div>
        <div class="present__submiting">
            <button class="present__submit-button" id="send_gift">Отправить</button>
        </div>`;

        $('#tab-present').append(htmlContent);

        $('#send_gift').on('click', function() {
            sendGift();
        })

        $('#recognition-text').on('input', function() {
            selectedOptions.description = $(this).val();
        });

        $('#is-send-amount').click((elem) => {
            let checkbox_enabled = $(elem.target).is(':checked');
            $('#amount-count').prop('disabled', !checkbox_enabled);
            if (checkbox_enabled) {
            } else {
                $('#amount-count').val('');
                $('#error_message').remove();
                selectedOptions.amount = 0;
            }
        });

        $('.present__checkbox').each(function() {
            $(this).on('change', function() {
                let isChecked = $(this).is(':checked');
                if ($(this).attr('id') === 'is-send-amount') {
                    selectedOptions.is_paing = isChecked;
                } else if ($(this).attr('id') === 'publick-check') {
                    selectedOptions.is_personal = !isChecked;
                }
            })
        })

        $('#amount-count').on('input', function() {
            var $this = $(this);
            if ($this.val() > max_acceptance_amount) {
                $this.val(Number(max_acceptance_amount));

                if (!$this.next('.error-message').length) {
                    $this.after(`<span id="error_message" class="error-message" style="color: red; font-size: 12px;">Значение не может превышать ${max_acceptance_amount}</span>`);
                }
            } else if ($this.val() > Number(selectedOptions.balans_limit)) {
                $this.val(Number(selectedOptions.balans_limit));

                if (!$this.next('.error-message').length) {
                    $this.after(`<span id="error_message" class="error-message" style="color: red; font-size: 12px;">Значение не может превышать ${selectedOptions.balans_limit}</span>`);
                }
            } else if ($this.val() < 1 && $this.val()) {
                $this.val(Number(1));

                if (!$this.next('.error-message').length) {
                    $this.after(`<span id="error_message" class="error-message" style="color: red; font-size: 12px;">Значение не может быть меньше 1</span>`);
                }
            } else {
                $this.next('.error-message').remove();
            }

            selectedOptions.amount = $this.val();

        });
    }

    function restatrData() {
        selectedOptions = {
            type: '',
            recipient_id: '',
            sender_id: '',
            is_personal: true,
            amount: 0,
            resource_id: '',
            description: '',
            balans_limit: 0,
            is_paing: false
        };

        sendRequest({ mode: 'get_acceptance_trophys_icons' }, (data) => {
            selectedOptions.sender_id = data.boss
            selectedOptions.balans_limit = data.oAccount.balance
            $('#select_gifts').on('click', function() {
                selectGifts(data);
            });
        })

        $("#select_colls").on("click", function () {
            if (collaboratorsIds.data != undefined) {
                show("colleagues", "Коллеги и подчиненные", "collaborator", `${collaboratorsIds.data}`, true);
            } else {
                showWindow("Нет данных", "Список сотрудников для выбора получателей признания пуст.");
            }
        });
    }

    createHtml();
    if (collaboratorsIds.success) {
        restatrData();
    }
}

