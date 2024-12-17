DevExpress.localization.locale('ru');

//init
current_collaborator_id = $('#collaborator_id').html();
current_goalmap_id = $('#goalmap_id').html();
current_user_id = $('#user_id').html();
current_final_mark_id = 0;
permissionRules = {};
without_okrs = true;
include_non_actual = false;
id_tab = 0;
rps_list = {};

const tabsIconAndText = [
  {
    id: 0,
    icon: './download_file.html?file_id=7091902156163803051',
    addElem: () => addGoalDialog(),
    attr: '#goals',
      html: '<label id="tab-goal">Цели</label>'

  },
  {
    id: 1,
    icon: './download_file.html?file_id=0x662A856717782569',
    addElem: () => addOKRDialog(),
    attr: '#okrs',
      html: '<label id="tab-okr">Вклад в OKR</label>'
  },
  {
    id: 2,
    icon: './download_file.html?file_id=7091904165091680651',
    addElem: () => addIPRDialog(),
    attr: '#iprs',
      html: '<label id="tab-ipr">План развития</label>'
  },
  {
    id: 3,
    icon: './download_file.html?file_id=7091904372891037799',
    addElem: () => {},
    attr: '#gap',
      html: '<label id="tab-gap">Компетенции и потенциал</label>'
  },
];

 const tab = $('#tab-goals-header').dxTabs({
    width: 'auto',
    rtlEnabled: false,
    selectedIndex: 0,
    showNavButtons: false,
    dataSource: tabsIconAndText,
    stylingMode: 'secondary',
    iconPosition: 'start',
    onItemClick: (e) => {
        if (id_tab != e.itemIndex) {
            id_goal = tabsIconAndText.find((elem) => id_tab == elem.id).attr;
            $(id_goal).removeAttr("style").hide();
            $(e.itemData.attr).show();
            id_tab = Number(e.itemIndex);
            updatePermissionRules();
            if (e.itemData.attr == '#gap') {
                $('#button_add_goal').hide();
            } else $('#button_add_goal').show();
        }
    }
}).dxTabs('instance');

sendRequest({ mode: 'rps'}, (resp) => rps_list = resp );
sendRequest({ mode: 'goalmaps', collaborator_id: current_collaborator_id }, updateGoalmaps);
sendRequest({ mode: 'col_info', collaborator_id: current_collaborator_id }, updateColInfo);
updateGoalmapInfoRequest();
updateAllComments();
updateAllGoals();
updateAllOKRs();
updateAllIPRs();
updateAllGAP();
updatePermissionRules();

function isNull(value) {
    if (value == null || value == undefined || value == "") {
        return true;
    }
    return false;
}

$('#button_add_goal').on('click', () => {
    tabsIconAndText.find((elem) => elem.id == id_tab).addElem();
});


$('#year_selector').on('change', function () {
    goalmap_id = $(this).find(":selected").attr('goalmap_id');

    sendRequest({
        mode: 'goals',
        goalmap_id: goalmap_id
    }, updateGoals);

    sendRequest({
        mode: 'okrs',
        goalmap_id: goalmap_id
    }, updateOKRS);

    sendRequest({
        mode: 'iprs',
        goalmap_id: goalmap_id
    }, updateIPRS);

    updateGoalmapInfoRequest();

    sendRequest({
        mode: 'goalmap_comments',
        goalmap_id: goalmap_id
    }, updateGoalmapComments);

    updatePermissionRules();
});

$('#goalmap_irrelevant_check').on('change', function () {
    include_non_actual = this.checked;
    updateAllGoals();
    updateAllIPRs();
    updatePermissionRules();
});



function observeTextareas() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.tagName === 'TEXTAREA' && node.classList.contains('autoresize')) {
                    autoResize(node);
                } else if (node.querySelectorAll) {
                    node.querySelectorAll('textarea.autoresize').forEach(textarea => {
                        autoResize(textarea);
                    });
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', observeTextareas);

function updateAllComments() {
    sendRequest({
        mode: 'goalmap_comments',
        goalmap_id: $('#year_selector option:selected').attr('goalmap_id')
    }, updateGoalmapComments);
}

function updateAllGoals() {
    sendRequest({
        mode: 'goals',
        goalmap_id: $('#year_selector option:selected').attr('goalmap_id'),
        include_non_actual: include_non_actual
    }, updateGoals);
}

function updateAllOKRs() {
    sendRequest({
        mode: 'okrs',
        goalmap_id: $('#year_selector option:selected').attr('goalmap_id')
    }, updateOKRS);
}

function updateAllIPRs() {
    sendRequest({
        mode: 'iprs',
        goalmap_id: $('#year_selector option:selected').attr('goalmap_id'),
        include_non_actual: include_non_actual
    }, updateIPRS);
}

function updateAllGAP() {
    sendRequest({
        mode: 'gap',
        goalmap_id: $('#year_selector option:selected').attr('goalmap_id'),
    }, updateGAP);
}

function updateGoalmapInfoRequest() {
    sendRequest({
        mode: 'goalmap_info',
        goalmap_id: $('#year_selector option:selected').attr('goalmap_id')
    }, updateGoalmapInfo);
}

function sendToApprove(comment) {
    sendRequest({
        mode: 'update_goalmap',
        goalmap: {
            id: $('#year_selector option:selected').attr('goalmap_id'),
            manager_id: $('#goalmap_info_manager_fullname').attr('manager_id')
        },
        comment: comment,
        action_name: 'send_to_approve'
    }, () => {
        updateGoalmapInfoRequest();
        manager_fullname = $('#goalmap_info_manager_fullname').text();
        confirmDialog(`Форма годовых целей отправлена на согласование твоему руководителю ${manager_fullname}. Договорись с руководителем о встрече, на которой вы вместе обсудите твои годовые цели, результаты, план развития и потенциал.`, "Отправка на согласование руководителю");
    });
    updatePermissionRules();
    updateAllComments();
}

function showApproveDialog() {
    arrButtons = [{
        text: 'Отмена',
        class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
        click: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    }, {
        text: 'ОК',
        class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
        click: () => {
            sendToApprove($('#comment_collaborator').val());
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    }];
    sendRequest({ mode: 'col_info', collaborator_id: current_collaborator_id }, (info) => {
        if (info.position == 'RSC' || info.position == 'RSC Contractor') {
            arrButtons.splice(1, 0, {
                text: 'Изменить руководителя',
                class: 'wt-lp-dialog-btn wt-lp-dialog-change',
                click: () => {
                    show('Выберите руководителя', 'collaborator', permissionRules.available_bosses.map(x => x.id).join(';'), false, changeAvailableBosses);
                }
            });
        }
    })
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' class="wt-lp-dialog-body">
            <br>
            <div class="wt-lp-dialog-fld-container">
                <div class="wt-lp-dialog-fld dialog-fld-manaher">
                    Согласующий руководитель: <b id="dialog-win-manager">${$('#goalmap_info_manager_fullname').text()}<b>
                </div>
            </div>
            <br>
            <div class="wt-lp-dialog-fld-container">
                <label>Комментарий</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='comment_collaborator' class="autoresize" oninput="autoResize(this)"></textarea>
                </div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Отправить на согласование',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: arrButtons,
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    sendRequest({
        mode: 'col_manager',
        goalmap_id: $('#year_selector option:selected').attr('goalmap_id'),
    }, (col) => {
        if (col.fullname) {
            $('#dialog-win-manager').html(col.fullname);
            $('#goalmap_info_manager_fullname').attr('manager_id', col.manager_id)
        }
    });
    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}

function sendToApproveDialog() {
    if ($('#year_selector option:selected').attr('is_ready_approved_y2') == 'true' && !current_final_mark_id) {
        jAlert("Не заполнены обязательные поля", "Пожалуйста, заполните общую оценку выполнения целей.", true)
        return;
    }

    if ($('[baseGoal]').length != $('[checkedBaseGoal]').length && permissionRules.send_to_approve && !permissionRules.drop) {
        jAlert("Не заполнены обязательные поля", "Пожалуйста, проставь оценку результата по каждой цели и плану развития", true)
        return;
    }

    fields =  $('#current_salary_label, #want_salary_label, #comment_by_grow_label')

    for (i=0; i < fields.length; i++) {
        if (!fields[i].innerHTML) {
            jAlert("Не заполнены обязательные поля", fields[i].getAttribute('placeholder'), true)
            return;
        }
    }

    need_count_goals = true;
    sendRequest({
        mode: 'goals',
        goalmap_id: $('#year_selector option:selected').attr('goalmap_id'),
        include_non_actual: false
    }, function (goals) {
        if (goals.length < 3) {
            need_count_goals = false;
        }
    });

    if (!need_count_goals) {
        jAlert("Не заполнены обязательные поля", "Пожалуйста, добавьте не менее трех актуальных целей", true);
        return;
    }

    sendRequest({
        mode: 'goalmap_info',
        goalmap_id: $('#year_selector option:selected').attr('goalmap_id')
    }, (info) => {
        var cur_user_is_rsc = false;
        sendRequest({ mode: 'col_info', collaborator_id: current_collaborator_id }, (col_info) => {
            cur_user_is_rsc = col_info.subdivision == "RSC (Restaurants Support Center)" || col_info.subdivision == "FZ_RSC (Restaurants Support Center)";
        });

        if (!info.fake_position_id && cur_user_is_rsc) {
            jAlert("Не заполнены обязательные поля", "Пожалуйста, выбери должность из выпадающего списка", true);
            return;
        }

        if (info.state_code == 0) {
            showApproveDialog();
        } else if (info.state_code == 2 || info.state_code == 4 || info.state_code == 5) {
            sendToApprove();
        }
    });
}

function changeAvailableBosses(manager_id) {
    sendRequest({
        mode: 'save_goalmap',
        goalmap: {
            id: $('#year_selector option:selected').attr('goalmap_id'),
            manager_id: manager_id,
        },
    }, () => {
        updateGoalmapInfoRequest();
        $('#goalmap_info_manager_fullname').attr('manager_id', manager_id);
        $('#dialog-win-manager').html($('#goalmap_info_manager_fullname').text());
    });
    updatePermissionRules();
}

function approve(data, comment) {
    sendRequest({
        mode: 'update_goalmap',
        goalmap: data,
        action_name: 'approve',
        comment
    }, () => {
        var fio = $('#col_info_fullname').text()

        var message = "Форма годовых целей согласована и отправлена сотруднику " + fio + " на ознакомление.";
        if (permissionRules.approve_by_halfyear) {
            message = "Ты подтвердил промежуточную оценку  сотрудника " + fio + " и отравил форму ему на ознакомление. Обязательно договорись с сотрудником о встрече, на которой вы вместе обсудите его годовые цели, результаты, план развития и потенциал.";
            if ($('#year_selector option:selected').attr('is_ready_approved_y2') == 'true') {
                message = "Ты подтвердил годовую оценку результатов сотрудника " + fio + " и отравил форму ему на ознакомление. Обязательно договорись с сотрудником о встрече, на которой вы вместе обсудите его годовые цели, результаты, план развития и потенциал.";
            }
        }
        confirmDialog(message, "Подтверждение оценки результатов")
    });
    updatePermissionRules();
    updateGoalmapInfoRequest();
}

function approveWithComment(comment) {
    sendRequest({
        mode: 'update_goalmap',
        goalmap: {
            id: $('#year_selector option:selected').attr('goalmap_id'),
        },
        comment: comment,
        action_name: 'approve'
    }, () => {
        var fio = $('#col_info_fullname').text()

        var message = "Форма годовых целей согласована и отправлена сотруднику " + fio + " на ознакомление.";
        if (permissionRules.approve_by_halfyear) {
            message = "Ты подтвердил оценку  сотрудника " + fio + " и отравил форму ему на ознакомление. Обязательно договорись с сотрудником о встрече, на которой вы вместе обсудите его годовые цели, результаты, план развития и потенциал.";
            if ($('#year_selector option:selected').attr('is_ready_approved_y2') == 'true') {
                message = "Ты подтвердил годовую оценку результатов сотрудника " + fio + " и отравил форму ему на ознакомление. Обязательно договорись с сотрудником о встрече, на которой вы вместе обсудите его годовые цели, результаты, план развития и потенциал."
            }
        }
        confirmDialog(message, "Подтверждение оценки результатов")
    });
    updatePermissionRules();
    updateGoalmapInfoRequest();
    updateAllComments();
}

function cancelSendToApprove() {
    $('#goalmap_info_manager_fullname').removeAttr('manager_id');
    sendRequest({ mode: 'update_goalmap', goalmap: { id: $('#year_selector option:selected').attr('goalmap_id') }, action_name: 'cancel_send_to_approve' }, () => { });
    updatePermissionRules();
    updateGoalmapInfoRequest();
}

function returnToWork(comment_manager) {
    sendRequest({
        mode: 'update_goalmap',
        goalmap: {
            id: $('#year_selector option:selected').attr('goalmap_id'),
        },
        comment: comment_manager,
        action_name: 'return_to_work'
    }, () => {
        var fio = $('#col_info_fullname').text()
        confirmDialog("Форма годовых целей возвращена сотруднику " + fio + " на доработку.", "Возвращение на доработку")
    });
    updatePermissionRules();
    updateGoalmapInfoRequest();
    updateAllComments();
}

function confirm() {
    action = 'confirm';
    if (permissionRules.confirm && permissionRules.final_confirm) {
        action = 'compleated'
    }
    sendRequest({ mode: 'update_goalmap', goalmap: { id: $('#year_selector option:selected').attr('goalmap_id') }, action_name: action },
        () => {
            confirmDialog("Ты подтвердил ознакомление с формой", "Подтверждение ознакомления")
        });
    updatePermissionRules();
    updateGoalmapInfoRequest();
}

function updateColInfo(info) {
    $('#col_info_fullname').html(info.fullname);
    $('#col_info_position').html(info.position);
    $('#col_info_subdivision').html(info.subdivision);
    $('#col_info_department').html(info.department);
}

function updateGoalmapInfo(info) {
    goalmapSelectElem = $('#year_selector option:selected');
    goalmapSelectElem.attr('is_approved_y1', info.is_approved_y1);
    goalmapSelectElem.attr('is_approved_y2', info.is_approved_y2);
    goalmapSelectElem.attr('is_ready_approved_y2', info.is_ready_approved_y2);

    $('#goalmap_info_state_name').html(info.state_name);
    current_final_mark_id = info.finish_goals_mark;
    if ($('#final_result_desc .desc').length > 0) {
        $('#final_result_desc .desc')[0].innerHTML = `
            <div class="goal-result-value-body">
                <div class="goal-desc-value-row">
                        <div class="goal-desc-value" style="padding-left: 0em;">${info.finish_goals_mark_name}</div>
                    </div>
                <div class="goal-desc-value-row" style='display: ${!info.comment_coll ? 'none' : ''}; padding-top: 1.5em;'>
                    <div class="goal-desc-sub-header">Комментарий сотрудника:</div>
                    <div class="goal-desc-value">${info.comment_coll}</div>
                </div>
                <div class="goal-desc-value-row" style='display: ${!info.comment_manager ? 'none' : ''}'>
                    <div class="goal-desc-sub-header">Комментарий руководителя:</div>
                    <div class="goal-desc-value">${info.comment_manager}</div>
                </div>
            </div>
        `;
    }
    if (info.without_okr != without_okrs) {
        without_okrs = info.without_okr;
    }

    info.without_okr ? $(".dx-tab:has(#tab-okr)").hide() :  $(".dx-tab:has(#tab-okr)").show();

    if (info.manager_fullname != '') {
        $('#goalmap_info_manager_fullname').html(info.manager_fullname);
    } else {
        $('#goalmap_info_manager_fullname').html('Не определен');
    }

    if (info.fake_position_id) {
        $('#col_info_position').html(info.position_name);
    }
}

function updateGoalmapComments(comments) {
    if (comments.length == 0) {
        $('#col_info_comments_body').css('display', 'none');
        return;
    }

    $('#col_info_comments_body').css('display', '');
    comments_body = $('#col_info_comments_body').find('.ipr_comments_body');
    comments_body.empty();
    comments.forEach(comment => {
        if (comment.is_my_comment) {
            comments_body.append(`
                <div class="ipr_sended_comment_body">
                    <div class="ipr_comment_header">${comment.create_date_str}</div>
                    <div class="ipr_comment_message">${comment.comment}</div>
                </div>
            `);
        } else {
            comments_body.append(`
                <div class="ipr_received_comment_body">
                    <div class="ipr_comment_header">${comment.collaborator_fullname}, ${comment.create_date_str}</div>
                    <div class="ipr_comment_message">${comment.comment}</div>
                </div>
            `);
        }
    });
}

function updateGoals(goals) {
    goals_elem = $('#goals');
    goals_elem.empty();

    goalmapElem = $('#year_selector option:selected')[0];
    is_approved_y1 = goalmapElem.getAttribute('is_approved_y1') == 'true';
    is_ready_approved_y2 = goalmapElem.getAttribute('is_ready_approved_y2') == 'true';

    goals.forEach(goal => {
        goal_elem = $(`
            <div class="goal" goal_id="${goal.id}" baseGoal ${(goal[`y1_result`] && !is_approved_y1) || (goal[`y2_result`] && is_ready_approved_y2) ? 'checkedBaseGoal' : ''}>
                <div class="goal-header-body">
                    <div class="goal-header">
                        <div class="goal-header-text" title="${goal.goal_name.replace('\n', '<br>')}">${goal.goal_name}</div>
                    </div>
                    <div class="goal-buttons">
                        <button id="button_edit_desc" class="goal-edit-button">Редактировать</button>
                        <button id="button_show_desc" class="goal-edit-button">Посмотреть</button>
                        <button id="button_drop" class="goal-edit-button">Удалить</button>
                    </div>
                </div>
                <div class="goal-desc-body">
                    <div class="goal-desc" placeholder="Описание цели не заполнено."></div>
                    <div class="goal-plan-date">
                        <div class="goal-plan-date-header">Плановый срок:</div>
                        <div class="goal-plan-date-value">${goal.plan_date_str}</div>
                    </div>
                </div>
                <div class="goal-result-header-body">
                    <div class="goal-header-result">
                        <div class="goal-header-text">Оценка результата</div>
                    </div>
                    <div class="goal-buttons">
                        <button id="button_edit_result" class="goal-edit-button">Оценить результат</button>
                    </div>
                </div>
                <div class="goal-result-body">
                    <div class="goal-result" placeholder="Результаты цели не заполнены."></div>
                </div>
            </div>
        `);

        goal_results_elem = goal_elem.find('.goal-result');

        for (number = 1; number <= 2; number++) {
            if (!goal[`y${number}_result_name`]) {
                continue;
            }

            goal_results_elem.append(`
                <div class="goal-result-main-header">${number == 1 ? 'Промежуточная оценка' : 'Итоговая годовая оценка'}</div>
                <div class="goal-result-value-body">
                    <div class="goal-result-value-row">
                        <div class="goal-result-sub-header">Результат:</div>
                        <div class="goal-result-value">${goal[`y${number}_result_name`]}</div>
                    </div>
                    <div class="goal-result-value-row" style='display: ${!goal[`y${number}_comment`] ? 'none' : ''}'>
                        <div class="goal-result-sub-header">Комментарий сотрудника:</div>
                        <div class="goal-result-value">${goal[`y${number}_comment`]}</div>
                    </div>
					<div class="goal-result-value-row" style='display: ${!goal[`y${number}_comment_manager`] ? 'none' : ''}'>
                        <div class="goal-result-sub-header">Комментарий руководителя:</div>
                        <div class="goal-result-value">${goal[`y${number}_comment_manager`]}</div>
                    </div>
                </div>
            `)

        }

        goal_desc_elem = goal_elem.find('.goal-desc');

        goal_desc_elem.append(`
            <div class="goal-desc-value-body">
                <div class="goal-desc-value-row">
                    <div class="goal-desc-value" style="padding-left: 0em;">${goal.description}</div>
                </div>
                <div class="goal-desc-value-row" style='display: ${!goal.desc_what_done ? 'none' : ''}; padding-top: 1.5em;'>
                    <div class="goal-desc-sub-header" style='min-width: 13em;'>Что должно быть сделано:</div>
                    <div class="goal-desc-value">${goal.desc_what_done}</div>
                </div>
                <div class="goal-desc-value-row" style='display: ${!goal.desc_how_done ? 'none' : ''}'>
                    <div class="goal-desc-sub-header" style='min-width: 13em;'>Как должно быть сделано:</div>
                    <div class="goal-desc-value">${goal.desc_how_done}</div>
                </div>
                <div class="goal-desc-value-row" style='display: ${!goal.desc_comment_coll ? 'none' : ''}; padding-top: 1.5em;'>
                    <div class="goal-desc-sub-header">Комментарий сотрудника:</div>
                    <div class="goal-desc-value">${goal.desc_comment_coll}</div>
                </div>
                <div class="goal-desc-value-row" style='display: ${!goal.desc_comment_manager ? 'none' : ''}'>
                    <div class="goal-desc-sub-header">Комментарий руководителя:</div>
                    <div class="goal-desc-value">${goal.desc_comment_manager}</div>
                </div>
            </div>
        `)

        sendRequest({ mode: 'permission_rules', goalmap_id: $('#year_selector option:selected').attr('goalmap_id') },
            (rules) => {
                if (rules.approve && !rules.edit_result_main) {
                    goal_elem.find("#button_edit_desc").text("Добавить комментарии");
                }
            });

        goal_elem.find('#button_edit_desc').click(function () {
            editGoalDescDialog(goal)
        });

        goal_elem.find('#button_show_desc').click(function () {
            showGoalDescDialog(goal)
        });

        goal_elem.find('#button_drop').click(function () {
            dropGoalDialog(goal)
        });

        goal_elem.find('#button_edit_result').click(function () {
            editGoalResultDialog(goal)
        });

        goals_elem.append(goal_elem);
    });

    final_results = `
        <div class="viewport-goals-header" id="final_result">
            <div class="goals-main-header">Общая оценка выполнения целей</div>
            <button id="edit_final_goal" class="goal-edit-button">Оценить результат</button>
        </div>
		<div class="goal" id="final_result_desc">
            <div class="goal-desc-body">
                <div class="goal-desc desc" placeholder="Итоговая оценка не заполнена"></div>
            </div>
        </div>`

    if (goals.length > 0) {
        goals_elem.append(final_results);
        goals_elem.find('#edit_final_goal').click(function () {
            editFinalGoalResultDialog()
        });
    }

    if (goals.length == 0) {
        goals_elem.append("<div class='goal goal-empty-data'>Нет данных</div>")
    }

    updateGoalmapInfoRequest();
}

function updateGoalmaps(goalmaps) {
    year_selector_elem = $('#year_selector');
    year_selector_elem.empty();
    goalmaps.forEach(goalmap => {
        optionIsSelected = goalmap.id == current_goalmap_id;
        year_selector_elem.append(`
                <option
					goalmap_id="${goalmap.id}"
					is_approved_y1="${goalmap.is_approved_y1}"
					is_approved_y2="${goalmap.is_approved_y2}"
					is_ready_approved_y2="${goalmap.is_ready_approved_y2}"
					is_owner="${goalmap.collaborator_id == current_user_id}"
					${optionIsSelected ? 'selected' : ''}>
						${goalmap.year}
				</option>
            `);
    });
}

function updatePermissionRules() {
    sendRequest({ mode: 'permission_rules', goalmap_id: $('#year_selector option:selected').attr('goalmap_id') }, function (rules) {
        permissionRules = rules;
        editUnlock(rules);
    });
}

function editUnlock(rules) {
    $('[id=button_add_goal]').css('display', (rules.add && ($('#tab-goals-header .dx-tab-selected').find('#tab-gap').length == 0) ? '' : 'none'));
    $('[id=button_edit_desc]').css('display', (rules.edit_desc ? '' : 'none'));
    $('[id=button_edit_potenc], [id=button_edit_skill], [id=button_edit_risk], [id=button_edit_comm_manager_grow]').css('display', (rules.edit_psr ? '' : 'none'));
    $('[id=button_edit_cur_salary], [id=button_edit_want_salary], [id=button_edit_comm_grow]').css('display', (rules.edit_salary ? '' : 'none'));
    $('[id=button_show_desc]').css('display', (!rules.edit_desc ? '' : 'none'));
    $('[id=button_drop]').css('display', (rules.drop ? '' : 'none'));
    $('[id=button_edit_result]').css('display', (rules.edit_result_main ? '' : 'none'));
    $('#send_to_approve_button_on_edit_desc').css('display', (rules.send_to_approve && rules.drop ? '' : 'none'));
    $('#send_to_approve_button_on_edit_result_main').css('display', (rules.send_to_approve && rules.edit_result_main ? '' : 'none'));
    $('#cancel_send_to_approve_button').css('display', (rules.cancel_send_to_approve ? '' : 'none'));
    $('#approve_button').css('display', (rules.approve ? '' : 'none'));
    $('#return_to_work_button').css('display', (rules.return_to_work ? '' : 'none'));
    $('#confirm').css('display', (rules.confirm ? '' : 'none'));
    $('.goal-result-header-body').css('display', (rules.show_result_main ? '' : 'none'));
    $('.goal-result-body').css('display', (rules.show_result_main ? '' : 'none'));
    $('#final_result').css('display', (rules.edit_result_main || rules.show_result_main ? '' : 'none'));
    $('#edit_final_goal').css('display', (rules.edit_result_main ? '' : 'none'));
    $('#final_result_desc').css('display', (rules.edit_result_main || rules.show_result_main ? '' : 'none'));
    if (!rules.send_to_approve && !rules.cancel_send_to_approve && !rules.approve && !rules.return_to_work && !rules.confirm) {
        $('#viewport_buttons').css('display', 'none');
    } else {
        $('#viewport_buttons').css('display', 'block');
    }
}

function editUnlockQuarterFields() {
    var goalmapElem = $('#year_selector option:selected')[0];
    var is_approved_y1 = goalmapElem.getAttribute('is_approved_y1') == 'true';
    var is_approved_y2 = goalmapElem.getAttribute('is_approved_y2') == 'true';
    var is_ready_approved_y2 = goalmapElem.getAttribute('is_ready_approved_y2') == 'true';

    $(`#y1_comment`).prop('disabled', is_ready_approved_y2 || (permissionRules.approve || permissionRules.approve_by_halfyear));
    $(`#y2_comment`).prop('disabled', !(!is_approved_y2 && is_ready_approved_y2) ||
        !(permissionRules.edit_result_main && permissionRules.send_to_approve));

    $(`#y1_comment_manager`).prop('disabled', !(permissionRules.approve || permissionRules.approve_by_halfyear) || is_ready_approved_y2);
    $(`#y2_comment_manager`).prop('disabled', !(!is_approved_y2 && is_ready_approved_y2) || !(permissionRules.edit_result_main && (permissionRules.approve || permissionRules.approve_by_halfyear)));


    if (!(!is_approved_y2 && is_ready_approved_y2)) {
        if ($(`input#y2_result`).length == 0) {
            $(`select#y2_result`).prop('aria-disabled', true);
            $('select#y2_result').selectmenu('disable');
        } else {
            $(`input#y2_result`)[0].disabled = true;
        }
    }

    if (is_ready_approved_y2) {
        if ($(`input#y1_result`).length == 0) {
            $(`select#y1_result`).prop('aria-disabled', true);
            $('select#y1_result').selectmenu('disable');
        } else {
            $(`input#y1_result`)[0].disabled = true;
        }
    }
}

function convertDate(str_date) {
    if (!str_date) {
        return '';
    }
    let date = new Date(str_date)
    return date.toISOString().split('T')[0];
}

function sendRequest(body, action, prop_name) {
    var response_data;

    $.ajax({
        url: 'goal_settings/goal_setting_col/goal_settting_col_controller.html',
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

function saveGoalmap(goalmap) {
    sendRequest({ mode: 'save_goalmap', goalmap }, () => { });
}

function saveGAP(goalmap) {
    sendRequest({ mode: 'save_goalmap', goalmap }, () => { });
    updateAllGAP();
    updatePermissionRules();
}

function saveGoal(goal) {
    sendRequest({ mode: 'save_goal', goal: goal }, () => { });
    updateAllGoals();
    updatePermissionRules();
}

function dropGoal(goal) {
    sendRequest({ mode: 'drop_goal', goal: goal }, () => { });
    updateAllGoals();
    updatePermissionRules();
}

function dropOkr(okr) {
    sendRequest({ mode: 'drop_goal', goal: okr }, () => { });
    updateAllOKRs();
    updatePermissionRules();
}

function saveOkr(okr) {
    sendRequest({ mode: 'save_okr', okr: okr }, () => { });
    updateAllOKRs();
    updatePermissionRules();
}

function dropIpr(okr) {
    sendRequest({ mode: 'drop_goal', goal: okr }, () => { });
    updateAllIPRs();
    updatePermissionRules();
}

function saveIPR(ipr) {
    response_data = sendRequest({ mode: 'save_ipr', ipr: ipr }, () => { });

    if (response_data.error_message) {
        return response_data.error_message;
    }

    updateAllIPRs();
    updatePermissionRules();
}

function editPositionDialog() {
    $('#dialog_background_overlay').css('display', 'block');

    $(` <div id='ui_dialog' class="wt-lp-dialog-body">
            <br>
            <div id='dialog_tabs' class='dialog-tabs'>
                <div class="wt-lp-dialog-fld-container">
                    <div class="header-description-block">
                        <label style="font-size: 1.7rem; color: #000; padding: 2rem 0 1rem 0;">Список должностей</label>
                    </div>
                    <div class="wt-lp-dialog-fld">
                        <select id='fake_positions' number='1'></select>
                    </div>
                </div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Редактирование должности сотрудника',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Сохранить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                sendRequest({
                    mode: 'update_goalmap_position',
                    goalmap_id: $('#year_selector option:selected').attr('goalmap_id'),
                    fake_position_id: $('#fake_positions option:selected').attr('fake_position_id')
                }, () => {
                    updateGoalmapInfoRequest();
                });

                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    col_department = $('#col_info_department').text();

    sendRequest({ mode: 'fake_positions', department: col_department }, (fake_positions) => {
        tabSelects = $('#dialog_tabs').find('select');

        currentPosId = 0;
        sendRequest({
            mode: 'goalmap_info',
            goalmap_id: $('#year_selector option:selected').attr('goalmap_id')
        }, (info) => {
            if (info.fake_position_id) {
                currentPosId = info.fake_position_id;
            }
        });

        fake_positions.forEach(fake_position => {
            tabSelects.each((index, tabSelect) => {
                optionIsSelected = currentPosId == fake_position.id;
                option = $(tabSelect).append(`<option fake_position_id="${fake_position.id}" ${optionIsSelected ? 'selected' : ''}>${fake_position.position_name}</option>`);
            })
        });
    });

    select_elems = $('#dialog_tabs').find('select');
    select_elems.each((index, select_elem) => {
        number = $(select_elem).attr('number');
        $(select_elem).selectmenu();
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}

function editGoalResultDialog(goal) {
    $('#dialog_background_overlay').css('display', 'block')
    $(`
        <div id='ui_dialog' goal_id='${goal.id}' class="wt-lp-dialog-body">
            <br>
            <div id='dialog_tabs_buttons' class='dialog-tabs-buttons'></div>
            <div id='dialog_tabs' class='dialog-tabs'></div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Редактирование результата цели №' + goal.number,
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Сохранить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                var dataY1before = {
                    y1_result: goal.y1_result,
                    y1_comment: goal.y1_comment,
                    y1_comment_manager: goal.y1_comment_manager
                };
                var goalmapObj = $('#year_selector option:selected');
                var is_approved_y1 = goalmapObj.attr('is_approved_y1') == 'true';

                var commentQ1 = $('#ui_dialog #y1_comment').val();
                var resultQ1 = $('#ui_dialog #y1_result option:selected').attr('goal_result_id');

                var commentQ2 = $('#ui_dialog #y2_comment').val();
                var resultQ2 = $('#ui_dialog #y2_result option:selected').attr('goal_result_id');

                if (!commentQ1 && !!resultQ1 && goalmapObj.attr('is_owner') == 'true' && !is_approved_y1) {
                    jAlert("Не заполнены обязательные поля", "Пожалуйста, внеси комментарий к своей оценке результата")
                    return;
                }

                if ((!commentQ2 && !!resultQ2 && goalmapObj.attr('is_owner') == 'true')) {
                    jAlert("Не заполнены обязательные поля", "Пожалуйста, внеси комментарий к своей оценке результата")
                    return;
                }

                var commentManagerQ1 = $('#ui_dialog #y1_comment_manager').val();
                var commentManagerQ2 = $('#ui_dialog #y2_comment_manager').val();

                var currentY1data = {
                    y1_result: resultQ1,
                    y1_comment: commentQ1,
                    y1_comment_manager: commentManagerQ1
                }

                saveGoal({
                    id: goal.id,
                    y1_result: $('#y1_result option:selected').attr('goal_result_id'),
                    y2_result: $('#y2_result option:selected').attr('goal_result_id'),

                    y1_comment: $('#y1_comment').val(),
                    y2_comment: $('#y2_comment').val(),

                    y1_comment: commentQ1,
                    y2_comment: commentQ2,
                    y1_comment_manager: commentManagerQ1,
                    y2_comment_manager: commentManagerQ2,
                });

                if (is_approved_y1 && (dataY1before.y1_result != currentY1data.y1_result)) {
                    updateGoalmapInfoRequest();
                    updateAllGoals();
                    updateAllOKRs();
                    updateAllIPRs();
                    updatePermissionRules();
                }

                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    var only1HalfYear = $('#year_selector option:selected').attr('is_ready_approved_y2') != 'true';
    var count = only1HalfYear ? 1 : 2
    for (number = 1; number <= count; number++) {
        $('#dialog_tabs_buttons').append(`
            <button id='button_tab_y${number}' class='tab-button' tab_number='${number}' onclick='enableDialogTab(undefined, this)'>
				${number == 1 ? 'Промежуточная оценка' : 'Итоговая годовая оценка'}
			</button>
        `)

        $('#dialog_tabs').append(`
            <div id='tab_y${number}' tab_number='${number}' class='dialog-tab'>
                <div class="wt-lp-dialog-fld-container">
                    <label>Описание:</label>
                    <div class="wt-lp-dialog-fld">
                        <textarea id="goal_desc" disabled class="autoresize" oninput="autoResize(this)">${goal.description}</textarea>
                    </div>
                </div>
                <div class="wt-lp-dialog-fld-container">
                    <label>Результат</label>
                    <div class="wt-lp-dialog-fld">
                        <select id='y${number}_result' number='${number}'></select>
                    </div>
                </div>
                <div class="wt-lp-dialog-fld-container">
                    <label>Внеси свои комментарии по целям и оценкам:</label>
                    <label>Какие цели являются приоритетными и почему?</label>
                    <label>Что было сделано за прошедший период и как?</label>
                    <div class="wt-lp-dialog-fld">
                        <textarea id='y${number}_comment' class="autoresize" oninput="autoResize(this)" placeholder="Обязательное для заполнения поле">${goal[`y${number}_comment`]}</textarea>
                    </div>
				</div>
				<div class="wt-lp-dialog-fld-container">
					<label>Комментарий руководителя:</label>
                    <div class="wt-lp-dialog-fld">
                        <textarea id='y${number}_comment_manager' class="autoresize" oninput="autoResize(this)">${goal[`y${number}_comment_manager`]}</textarea>
                    </div>
				</div>
            </div>
        `)
    }

    sendRequest({ mode: 'goal_results' }, (goal_results) => {
        tabSelects = $('#dialog_tabs').find('select');

        tabSelects.append(`<option></option>`)
        goal_results.forEach(goal_result => {
            tabSelects.each((index, tabSelect) => {
                number = $(tabSelect).attr('number');
                optionIsSelected = goal[`y${number}_result`] == goal_result.id;
                option = $(tabSelect).append(`<option goal_result_id="${goal_result.id}" ${optionIsSelected ? 'selected' : ''}>${goal_result.name}</option>`)
            })
        });
    });

    select_elems = $('#dialog_tabs').find('select');

    select_elems.each((index, select_elem) => {
        number = $(select_elem).attr('number');
        $(select_elem).selectmenu();
    });

    editUnlockQuarterFields();
    enableDialogTab(1);

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}

function enableDialogTab(tabNumber, jDialogTabButton) {
    targetTabNumber = tabNumber;
    if (!targetTabNumber) {
        targetTabNumber = $(jDialogTabButton).attr('tab_number')
    }

    tabButtons = $('#dialog_tabs_buttons').find('.tab-button');
    tabButtons.css('border-color', '');
    tabButtons.css('background-color', '');
    tabButtons.css('color', '');

    tabs = $('#dialog_tabs').find('.dialog-tab');
    tabs.css('display', 'none');

    tagetTabButton = $('#dialog_tabs_buttons').find(`#button_tab_y${targetTabNumber}`);
    targetTab = $('#dialog_tabs').find(`#tab_y${targetTabNumber}`);

    targetTab.css('display', 'block');

    tagetTabButton.css('border-color', '#a72d2d');
    tagetTabButton.css('background-color', '#a72d2d');
    tagetTabButton.css('color', '#FFFFFF');
}

function jAlertOKR() {
    jAlert('OKR', '<b>OKR (Objectives and Key Results)</b> — это методика постановки, синхронизации и мониторинга целей и ключевых результатов на уровне организации, команды и индивидуально.<br>Для постановки OKR определите 3–5 амбициозных целей на определённый цикл (обычно год или квартал) и 3–5 ключевых результатов для каждой цели.<br>Регулярно оценивайте уровень достижения целей и ключевых результатов по истечении заданного цикла.');
}

function jAlertGoalSmart() {
    jAlert('Описание цели по SMART', 'Цель должна быть:<br><br>S (specific) — конкретной<br>М (measurable) — измеримой<br>А (achievable) — реалистичной, достижимой<br>R (relevant) — актуальной и значимой<br>Т (time bound) — иметь дедлайн,привязку ко времени');
}

function jAlertGoalDescResult() {
    jAlert('Описание результата', 'Каждая цель должна иметь описание требуемого результата на каждую из возможных оценок.<br><br> Результат описывается по двум блокам:<br> 1) ЧТО - какой должен быть конечный бизнес результат, конкретные качественные и колличественные показатели;<br> 2) КАК - какое поведение должен демонстрировать сотрудник при работе над целью, как он будет демонстрировать приверженность ценностям компании.');
}

function addGoalDialog() {
    is_owner = $('#year_selector option:selected').attr('is_owner');
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <div class="header-description-block">
					<label style="font-size: 1.7rem; color: #000; padding: 2rem 0 1rem 0;">Описание цели по SMART</label>
					<div class="goal-help" onclick="jAlertGoalSmart()"></div>
				</div>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc' class="autoresize" oninput="autoResize(this)" placeholder="Обязательное для заполнения поле"></textarea>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Срок выполнения</label>
                <div class="wt-lp-dialog-fld">
                    <input type="date" id="goal_plan_date"></input>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container header">
			<div class="header-description-block">
					<label  style="font-size: 1.7rem; color: #000;">Описание результата</label>
					<div class="goal-help" onclick="jAlertGoalDescResult()"></div>
				</div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Что должно быть сделано</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_what_done' class="autoresize" oninput="autoResize(this)" placeholder="Обязательное для заполнения поле"></textarea>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Как должно быть сделано</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_how_done' class="autoresize" oninput="autoResize(this)" placeholder="Обязательное для заполнения поле"></textarea>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Комментарий сотрудника</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_coll' class="autoresize" oninput="autoResize(this)"></textarea>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Комментарий руководителя</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_manager' class="autoresize" oninput="autoResize(this)"></textarea>
                </div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Добавление новой цели',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Добавить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                goalmap_id = $('#year_selector option:selected').attr('goalmap_id');
                goal_desc = $('#ui_dialog').find('#goal_desc').val();
                goal_plan_date = $('#ui_dialog').find('#goal_plan_date').val();
                desc_what_done = $('#ui_dialog').find('#goal_desc_what_done').val();
                desc_how_done = $('#ui_dialog').find('#goal_desc_how_done').val();
                desc_comment_coll = $('#ui_dialog').find('#goal_desc_comment_coll').val();
                desc_comment_manager = $('#ui_dialog').find('#goal_desc_comment_manager').val();
                if (goal_desc && goal_plan_date && desc_what_done && desc_how_done) {
                    saveGoal({
                        goalmap_id: goalmap_id,
                        description: goal_desc,
                        plan_date: goal_plan_date,
                        desc_what_done: desc_what_done,
                        desc_how_done: desc_how_done,
                        desc_comment_coll: desc_comment_coll,
                        desc_comment_manager: desc_comment_manager
                    });
                    $('#ui_dialog').remove();
                    $('#dialog_background_overlay').css('display', 'none');
                } else {
                    jAlert("Не заполнены обязательные поля", "Пожалуйста, заполни все обязательные поля")
                }

            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');

    if (is_owner == 'true') {
        $('#ui_dialog').find('#goal_desc_comment_manager').attr('readonly', true);
    } else {
        $('#ui_dialog').find('#goal_desc_comment_coll').attr('readonly', true);
    }
}

function editGoalDescDialog(goal) {
    is_owner = $('#year_selector option:selected').attr('is_owner');
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' goal_id='${goal.id}' class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <div class="header-description-block">
					<label style="font-size: 1.7rem; color: #000; padding: 2rem 0 1rem 0;">Описание цели по SMART</label>
					<div class="goal-help" onclick="jAlertGoalSmart()"></div>
				</div>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc' class="autoresize" oninput="autoResize(this)">${goal.description}</textarea>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Срок выполнения</label>
                <div class="wt-lp-dialog-fld">
                    <input type="date" id="goal_plan_date" value="${convertDate(goal.plan_date)}"></input>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container header">
			<div class="header-description-block">
					<label  style="font-size: 1.7rem; color: #000;">Описание результата</label>
					<div class="goal-help" onclick="jAlertGoalDescResult()"></div>
				</div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Что должно быть сделано</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_what_done' class="autoresize" oninput="autoResize(this)">${goal.desc_what_done ? goal.desc_what_done : ''}</textarea>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Как должно быть сделано</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_how_done' class="autoresize" oninput="autoResize(this)">${goal.desc_how_done ? goal.desc_how_done : ''}</textarea>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Комментарий сотрудника</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_coll' class="autoresize" oninput="autoResize(this)">${goal.desc_comment_coll ? goal.desc_comment_coll : ''}</textarea>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Комментарий руководителя</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_manager' class="autoresize" oninput="autoResize(this)">${goal.desc_comment_manager ? goal.desc_comment_manager : ''}</textarea>
                </div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Редактирование цели №' + goal.number,
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Сохранить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                goal_desc = $('#ui_dialog').find('#goal_desc').val();
                goal_plan_date = $('#ui_dialog').find('#goal_plan_date').val();
                desc_what_done = $('#ui_dialog').find('#goal_desc_what_done').val();
                desc_how_done = $('#ui_dialog').find('#goal_desc_how_done').val();
                desc_comment_coll = $('#ui_dialog').find('#goal_desc_comment_coll').val();
                desc_comment_manager = $('#ui_dialog').find('#goal_desc_comment_manager').val();
                if (goal_desc && goal_plan_date && desc_what_done && desc_how_done) {
                    saveGoal({
                        id: goal.id,
                        description: goal_desc,
                        plan_date: goal_plan_date,
                        desc_what_done: desc_what_done,
                        desc_how_done: desc_how_done,
                        desc_comment_coll: desc_comment_coll,
                        desc_comment_manager: desc_comment_manager
                    });
                    $('#ui_dialog').remove();
                    $('#dialog_background_overlay').css('display', 'none');
                } else {
                    jAlert("Не заполнены обязательные поля", "Пожалуйста, заполни все обязательные поля")
                }
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');

    if (is_owner != 'true') {
        $('#ui_dialog').find('textarea, input[type="date"]').attr('readonly', true);
    }

    if (is_owner == 'true') {
        $('#ui_dialog').find('#goal_desc_comment_manager').attr('readonly', true);
    } else {
        $('#ui_dialog').find('#goal_desc_comment_manager').removeAttr('readonly');
    }
}

function showGoalDescDialog(goal) {
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' goal_id='${goal.id}' class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <div class="header-description-block">
					<label style="font-size: 1.7rem; color: #000; padding: 2rem 0 1rem 0;">Описание цели по SMART</label>
					<div class="goal-help" onclick="jAlertGoalSmart()"></div>
				</div>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc' readonly class="autoresize" oninput="autoResize(this)">${goal.description}</textarea>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Срок выполнения</label>
                <div class="wt-lp-dialog-fld">
                    <input type="date" id="goal_plan_date" value="${convertDate(goal.plan_date)}" readonly></input>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container header">
			<div class="header-description-block">
					<label  style="font-size: 1.7rem; color: #000;">Описание результата</label>
					<div class="goal-help" onclick="jAlertGoalDescResult()"></div>
				</div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Что должно быть сделано</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_what_done' readonly class="autoresize" oninput="autoResize(this)">${goal.desc_what_done ? goal.desc_what_done : ''}</textarea>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Как должно быть сделано</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_how_done' readonly class="autoresize" oninput="autoResize(this)">${goal.desc_how_done ? goal.desc_how_done : ''}</textarea>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Комментарий сотрудника</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_coll' readonly class="autoresize" oninput="autoResize(this)">${goal.desc_comment_coll ? goal.desc_comment_coll : ''}</textarea>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Комментарий руководителя</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_manager' readonly class="autoresize" oninput="autoResize(this)">${goal.desc_comment_manager ? goal.desc_comment_manager : ''}</textarea>
                </div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Просмотр цели №' + goal.number,
        width: '50%',
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
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}

function dropGoalDialog(goal) {
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' goal_id='${goal.id}' class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <div class="header-description-block">
					<label style="font-size: 1.7rem; color: #000; padding: 2rem 0 1rem 0;">Цель №${goal.number} будет удалена. Ты уверен, что хочешь продолжить?</label>
				</div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Удаление цели №' + goal.number,
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Подтвердить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                dropGoal({
                    id: goal.id
                });
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}

function getSkillData() {
    skillData = {
        skill_type: undefined,
    };

    $('.chk-skill').each(function() {
        if ($(this).prop("checked")) {
            skillData.skill_type = $(this).attr("skillType");
        }
    })


    if (skillData.skill_type == "soft") {
        skillData = {
            ...skillData,
            competence_id: $('#comp_name').attr("competence_id"),
        }
    } else if (skillData.skill_type == "hard") {
        skillData = {
            ...skillData,
            description: $('#ui_dialog').find('#goal_desc').val(),
        }
    }

    return skillData;
}

function addIPRDialog() {
    is_owner = $('#year_selector option:selected').attr('is_owner');
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <div class="header-description-block" style="width: 100%; border-bottom: 1px solid #969EB2; display: block;">
					<label style="font-size: 1.7rem; color: #000; padding: 2rem 0 0.5rem 0;">Что буду развивать*</label>
				</div>
                <div class="wt-lp-dialog-fld skill-wrap" style="padding: 0.5rem 0 1rem 0;">
                    <div class="wt-lp-dialog-wrap">
                        <input type="checkbox" skillType="soft" class="chk-skill" />
                        <label class="wt-lp-title-skill">Лидерская компетенция (soft skill)</label>
                    </div>
                    <div class="wt-lp-dialog-wrap">
                        <input type="checkbox" skillType="hard" class="chk-skill" />
                        <label class="wt-lp-title-skill">Профессиональный навык (hard skill)</label>
                    </div>
                 </div>
                <div class="wt-lp-dialog-fld ">
                    <div id="skill-descr"></div>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Срок выполнения</label>
                <div class="wt-lp-dialog-fld">
                    <input type="date" id="goal_plan_date"></input>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Мой план действий</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_action' placeholder="Обязательное для заполнения поле" class="autoresize" oninput="autoResize(this)"></textarea>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container" style='display: none !important'>
                <label>Обучающие программы</label>
                <div class="wt-lp-dialog-fld" id="education-program"></div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Ресурсы</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_resource' placeholder="Обязательное для заполнения поле" class="autoresize" oninput="autoResize(this)"></textarea>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Комментарий сотрудника</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_coll' class="autoresize" oninput="autoResize(this)"></textarea>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Комментарий руководителя</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_manager' class="autoresize" oninput="autoResize(this)"></textarea>
                </div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Добавление плана развития',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Сохранить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                skillData = getSkillData();

                if (isNull(skillData.skill_type) || (isNull(skillData.description) && isNull(skillData.competence_id))) {
                    jAlert('Ошибка при добавлении', 'Невозможно добавить плана развития. Пожалуйста, заполни обязательное поле  «Что буду развивать»!');
                    return;
                }

                goalmap_id = $('#year_selector option:selected').attr('goalmap_id');
                goal_plan_date = $('#ui_dialog').find('#goal_plan_date').val();
                goal_action = $('#ui_dialog').find('#goal_action').val();
                goal_resource = $('#ui_dialog').find('#goal_resource').val();
                educ_program_id = $('#education-program').attr('educ_program_id');
                desc_comment_coll = $('#ui_dialog').find('#goal_desc_comment_coll').val();
                desc_comment_manager = $('#ui_dialog').find('#goal_desc_comment_manager').val();


                if (goal_plan_date && goal_action && goal_resource) {
                    error_message = saveIPR({
                        goalmap_id: goalmap_id,
                        ...skillData,
                        plan_date: goal_plan_date,
                        actions: goal_action,
                        resource: goal_resource,
                        cc_education_program_id: educ_program_id,
                        desc_comment_coll: desc_comment_coll,
                        desc_comment_manager: desc_comment_manager
                    });

                    if (error_message) {
                        jAlert('Ошибка при добавлении', error_message);
                        return;
                    }

                    $('#ui_dialog').remove();
                    $('#dialog_background_overlay').css('display', 'none');
                } else {
                    jAlert("Не заполнены обязательные поля", "Пожалуйста, заполни все обязательные поля")
                }
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');

    sendRequest({ mode: 'educ_program_info' }, (educ_info) => {
        $('#education-program').dxSelectBox({
            items: educ_info,
            displayExpr: 'name',
            valueExpr: 'id',
            onSelectionChanged(e) {
                $(e.element).attr('educ_program_id', e.selectedItem.id);
            },
          });
    });

    $(function() {
        $("input:checkbox.chk-skill").each(function(){
          $(this).change(function(){
                $("input:checkbox.chk-skill").not($(this)).prop("checked", false);
                $(this).prop("checked", $(this).prop("checked"));
                $("#skill-descr").empty();

                if ($(this).prop("checked")) {
                    skillType = $(this).attr("skillType");
                    if (skillType == "soft") {
                        $("#skill-descr").dxToolbar({
                            items: [
                                {
                                    widget: "dxButton",
                                    location: "before",
                                    options: {
                                        text: 'Компетенция',
                                        width: (window.screen.width >= 775 ? "auto" : "19em"),
                                        onClick() {
                                            if (is_owner == "true")
                                                sendRequest({ mode: 'get_comptenece_360_unirest'}, (data) => {
                                                    show('Список компетенций', 'competence', data.competence_ids, false, null, "name", "+");
                                                });
                                        },
                                    },
                                }, {
                                    widget: "dxTextBox",
                                    location: "before",
                                    options: {
                                        disabled: true,
                                        elementAttr: { id: 'comp_name' },
                                        width: "19em",
                                        height: "2.4em",
                                        onClick() {

                                        },
                                    },
                                }
                            ]
                        });
                } else if (skillType == "hard") {
                    $('#skill-descr').append(`<textarea id='goal_desc' placeholder="Развитие не заполнено." class="autoresize" oninput="autoResize(this)"></textarea>`)
                }
              }
          });
        });
        $(`input[skilltype=${ipr.skill_type}]`).prop('checked', true);
        $(`input[skilltype=${ipr.skill_type}]`).trigger('change');
    });

    if (is_owner == 'true') {
        $('#ui_dialog').find('#goal_desc_comment_manager').attr('readonly', true);
    } else {
        $('#ui_dialog').find('#goal_desc_comment_coll').attr('readonly', true);
        $('#ui_dialog').find('.chk-skill').prop('disabled', true);
    }
}

function dropIPRDialog(ipr) {
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <div class="header-description-block">
					<label style="font-size: 1.7rem; color: #000; padding: 2rem 0 1rem 0;">План развития «${ipr.title}» будет удален. Ты уверен, что хочешь продолжить?</label>
				</div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Удаление плана развития',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Подтвердить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                dropIpr({
                    id: ipr.id
                });
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}

function showIPRDialog(ipr) {
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <div class="header-description-block" style="width: 100%; border-bottom: 1px solid #969EB2; display: block;">
					<label style="font-size: 1.7rem; color: #000; padding: 2rem 0 0.5rem 0;">Что буду развивать*</label>
				</div>
                <div class="wt-lp-dialog-fld skill-wrap" style="padding: 0.5rem 0 1rem 0;">
                    <div class="wt-lp-dialog-wrap">
                        <input type="checkbox" skillType="soft" class="chk-skill" />
                        <label class="wt-lp-title-skill">Лидерская компетенция (soft skill)</label>
                    </div>
                    <div class="wt-lp-dialog-wrap">
                        <input type="checkbox" skillType="hard" class="chk-skill" />
                        <label class="wt-lp-title-skill">Профессиональный навык (hard skill)</label>
                    </div>
                 </div>
                <div class="wt-lp-dialog-fld ">
                    <div id="skill-descr"></div>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Срок выполнения</label>
                <div class="wt-lp-dialog-fld">
                    <input type="date" id="goal_plan_date" value="${convertDate(ipr.plan_date)}" readonly></input>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Мой план действий</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_action' placeholder="План действий не заполнен." readonly class="autoresize" oninput="autoResize(this)">${ipr.actions ? ipr.actions : ''}</textarea>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Ресурсы</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_resource' placeholder="Ресурсы не заполнены." readonly class="autoresize" oninput="autoResize(this)">${ipr.resource ? ipr.resource : ''}</textarea>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container" style="display: none !important">
                <label>Обучающие программы</label>
                <div class="wt-lp-dialog-fld" id="education-program"></div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Комментарий сотрудника</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_coll' readonly class="autoresize" oninput="autoResize(this)" placeholder="Обязательное для заполнения поле">${ipr.desc_comment_coll ? ipr.desc_comment_coll : ''}</textarea>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Комментарий руководителя</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_manager' readonly class="autoresize" oninput="autoResize(this)">${ipr.desc_comment_manager ? ipr.desc_comment_manager : ''}</textarea>
                </div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Просмотр плана развития',
        width: '50%',
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
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');

    sendRequest({ mode: 'educ_program_info' }, (educ_info) => {
        $('#education-program').dxSelectBox({
            items: educ_info,
            disabled: true,
            displayExpr: 'name',
            valueExpr: 'id',
            value: ipr.cc_education_program_id,
            onSelectionChanged(e) {
                $(e.element).attr('educ_program_id', e.selectedItem.id);
            },
          });
    });

    $(function() {
        $("input:checkbox.chk-skill").each(function(){
            $(this).change(function(){
                $("input:checkbox.chk-skill").not($(this)).prop("checked", false);
                $(this).prop("checked", $(this).prop("checked"));
                $("#skill-descr").empty();

                if ($(this).prop("checked")) {
                    skillType = $(this).attr("skillType");
                    if (skillType == "soft") {
                        $("#skill-descr").dxToolbar({
                            items: [
                                {
                                    widget: "dxButton",
                                    location: "before",
                                    options: {
                                        text: 'Компетенция',
                                        width: (window.screen.width >= 775 ? "auto" : "19em"),
                                        disabled: true,
                                        onClick() {
                                            sendRequest({ mode: 'get_comptenece_360_unirest'}, (data) => {
                                                show('Список компетенций', 'competence', data.competence_ids, false, null, "name", "+");
                                            });
                                        },
                                    },
                                }, {
                                    widget: "dxTextBox",
                                    location: "before",
                                    options: {
                                        text: ipr.competence_name,
                                        disabled: true,
                                        elementAttr: { id: 'comp_name', competence_id: ipr.competence_id},
                                        width: "19em",
                                        height: "2.4em",
                                        onClick() {

                                        },
                                    },
                                }
                            ]
                        });
                    } else if (skillType == "hard") {
                        $('#skill-descr').append(`<textarea id='goal_desc' placeholder="Развитие не заполнено." class="autoresize" readonly oninput="autoResize(this)">${ipr.description}</textarea>`)
                    }
                }
            });
        });
        $('#ui_dialog').find('.chk-skill').prop('disabled', true);
        $(`input[skilltype=${ipr.skill_type}]`).prop('checked', true);
        $(`input[skilltype=${ipr.skill_type}]`).trigger('change');
    });
}

function editIPRResultDialog(ipr) {
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' ipr_id='${ipr.id}' class="wt-lp-dialog-body">
            <br>
            <div id='dialog_tabs_buttons' class='dialog-tabs-buttons'></div>
            <div id='dialog_tabs' class='dialog-tabs'></div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Редактирование результата плана развития',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Сохранить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                var dataY1before = {
                    y1_result: ipr.y1_result,
                    y1_comment: ipr.y1_comment,
                    y1_comment_manager: ipr.y1_comment_manager
                };
                var goalmapObj = $('#year_selector option:selected');
                var is_approved_y1 = goalmapObj.attr('is_approved_y1') == 'true';

                var commentQ1 = $('#ui_dialog #y1_comment').val();
                var resultQ1 = $('#ui_dialog #y1_result option:selected').attr('ipr_result_id');

                var commentQ2 = $('#ui_dialog #y2_comment').val();
                var resultQ2 = $('#ui_dialog #y2_result option:selected').attr('ipr_result_id');

                if (!commentQ1 && !!resultQ1 && goalmapObj.attr('is_owner') == 'true' && !is_approved_y1) {
                    jAlert("Не заполнены обязательные поля", "Пожалуйста, внеси комментарий к своей оценке результата")
                    return;
                }

                if ((!commentQ2 && !!resultQ2 && goalmapObj.attr('is_owner') == 'true')) {
                    jAlert("Не заполнены обязательные поля", "Пожалуйста, внеси комментарий к своей оценке результата")
                    return;
                }

                var commentManagerQ1 = $('#ui_dialog #y1_comment_manager').val();
                var commentManagerQ2 = $('#ui_dialog #y2_comment_manager').val();

                var currentY1data = { y1_result: resultQ1, y1_comment: commentQ1, y1_comment_manager: commentManagerQ1 }

                var goalmapObj = $('#year_selector option:selected')


                saveIPR({
                    id: ipr.id,
                    y1_result: resultQ1,
                    y2_result: resultQ2,

                    y1_comment: commentQ1,
                    y2_comment: commentQ2,

                    y1_comment_manager: commentManagerQ1,
                    y2_comment_manager: commentManagerQ2,
                });

                if (is_approved_y1 && (dataY1before.y1_result != currentY1data.y1_result)) {
                    updateGoalmapInfoRequest();
                    updateAllGoals();
                    updateAllOKRs();
                    updateAllIPRs();
                    updatePermissionRules();
                }

                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    var only1HalfYear = $('#year_selector option:selected').attr('is_ready_approved_y2') != 'true';
    var count = only1HalfYear ? 1 : 2
    for (number = 1; number <= count; number++) {
        $('#dialog_tabs_buttons').append(`
            <button id='button_tab_y${number}' class='tab-button' tab_number='${number}' onclick='enableDialogTab(undefined, this)'>
			${number == 1 ? 'Промежуточная оценка' : 'Итоговая годовая оценка'}
			</button>
        `)

        $('#dialog_tabs').append(`
            <div id='tab_y${number}' tab_number='${number}' class='dialog-tab'>
                <div class="wt-lp-dialog-fld-container">
                    <label>Описание:</label>
                    <div class="wt-lp-dialog-fld">
                        <textarea id="goal_desc" disabled class="autoresize" oninput="autoResize(this)">${ipr.actions}</textarea>
                    </div>
                </div>
                <div class="wt-lp-dialog-fld-container">
                    <label>Результат</label>
                    <div class="wt-lp-dialog-fld">
                        <select id='y${number}_result' number='${number}'></select>
                    </div>
                </div>
                <div class="wt-lp-dialog-fld-container">
                    <label>Комментарий сотрудника:</label>
                    <div class="wt-lp-dialog-fld">
                        <textarea id='y${number}_comment' class="autoresize" oninput="autoResize(this) " placeholder="Обязательное для заполнения поле">${ipr[`y${number}_comment`]}</textarea>
                    </div>
                </div>
				<div class="wt-lp-dialog-fld-container" >
					<label>Комментарий руководителя:</label>
					<div class="wt-lp-dialog-fld">
						<textarea id='y${number}_comment_manager' class="autoresize" oninput="autoResize(this)">${ipr[`y${number}_comment_manager`]}</textarea>
					</div>
                </div>
            </div>
        `)
    }

    sendRequest({ mode: 'goal_results' }, (ipr_results) => {
        tabSelects = $('#dialog_tabs').find('select');
        tabSelects.append(`<option></option>`);

        ipr_results.forEach(ipr_result => {
            tabSelects.each((index, tabSelect) => {
                number = $(tabSelect).attr('number');
                optionIsSelected = ipr[`y${number}_result`] == ipr_result.id;
                option = $(tabSelect).append(`<option ipr_result_id="${ipr_result.id}" ${optionIsSelected ? 'selected' : ''}>${ipr_result.name}</option>`)
            })
        });
    });

    select_elems = $('#dialog_tabs').find('select');

    select_elems.each((index, select_elem) => {
        number = $(select_elem).attr('number');
        $(select_elem).selectmenu();
    });

    editUnlockQuarterFields();
    enableDialogTab(1);

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}

function editIPRDialog(ipr) {
    is_owner = $('#year_selector option:selected').attr('is_owner');
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' data-id="${ipr.id}" data-name="${ipr.name}" data-goalmap-id ="${ipr.goalmap_id ? ipr.goalmap_id : $('#year_selector option:selected').attr('goalmap_id')}" class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <div class="header-description-block" style="width: 100%; border-bottom: 1px solid #969EB2; display: block;">
					<label style="font-size: 1.7rem; color: #000; padding: 2rem 0 0.5rem 0;">Что буду развивать*</label>
				</div>
                <div class="wt-lp-dialog-fld skill-wrap" style="padding: 0.5rem 0 1rem 0;">
                    <div class="wt-lp-dialog-wrap">
                        <input type="checkbox" skillType="soft" class="chk-skill" />
                        <label class="wt-lp-title-skill">Лидерская компетенция (soft skill)</label>
                    </div>
                    <div class="wt-lp-dialog-wrap">
                        <input type="checkbox" skillType="hard" class="chk-skill" />
                        <label class="wt-lp-title-skill">Профессиональный навык (hard skill)</label>
                    </div>
                 </div>
                <div class="wt-lp-dialog-fld ">
                    <div id="skill-descr"></div>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Срок выполнения</label>
                <div class="wt-lp-dialog-fld">
                    <input type="date" id="goal_plan_date" value="${convertDate(ipr.plan_date)}"></input>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Мой план действий</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_action' placeholder="План действий не заполнен." class="autoresize" oninput="autoResize(this)">${ipr.actions ? ipr.actions : ''}</textarea>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Ресурсы</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_resource' placeholder="Ресурсы не заполнены." class="autoresize" oninput="autoResize(this)">${ipr.resource ? ipr.resource : ''}</textarea>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container" style="display: none !important">
                <label>Обучающие программы</label>
                <div class="wt-lp-dialog-fld" id="education-program"></div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Комментарий сотрудника</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_coll' class="autoresize" oninput="autoResize(this)" placeholder="Обязательное для заполнения поле">${ipr.desc_comment_coll ? ipr.desc_comment_coll : ''}</textarea>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Комментарий руководителя</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_manager' class="autoresize" oninput="autoResize(this)">${ipr.desc_comment_manager ? ipr.desc_comment_manager : ''}</textarea>
                </div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Редактирование плана развития',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Сохранить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {

                skillData = getSkillData();

                if (isNull(skillData.skill_type) || (isNull(skillData.description) && isNull(skillData.competence_id))) {
                    jAlert('Ошибка при добавлении', 'Невозможно добавить плана развития. Пожалуйста, заполни обязательное поле  «Что буду развивать»!');
                    return;
                }

                goal_id = $('#ui_dialog').find('#goal_desc').val();
                goal_plan_date = $('#ui_dialog').find('#goal_plan_date').val();
                goal_action = $('#ui_dialog').find('#goal_action').val();
                goal_resource = $('#ui_dialog').find('#goal_resource').val();
                educ_program_id = $('#education-program').attr('educ_program_id');
                desc_comment_coll = $('#ui_dialog').find('#goal_desc_comment_coll').val();
                desc_comment_manager = $('#ui_dialog').find('#goal_desc_comment_manager').val();
                originalIPRDataset = $('#ui_dialog')[0].dataset;

                if (goal_plan_date && goal_action && goal_resource) {
                    error_message = saveIPR({
                        id: originalIPRDataset.id,
                        goalmap_id: originalIPRDataset.goalmap_id,
                        ...skillData,
                        plan_date: goal_plan_date,
                        actions: goal_action,
                        resource: goal_resource,
                        cc_education_program_id: educ_program_id,
                        desc_comment_coll: desc_comment_coll,
                        desc_comment_manager: desc_comment_manager
                    });

                    if (error_message) {
                        jAlert('Ошибка при добавлении', error_message);
                        return;
                    }

                    $('#ui_dialog').remove();
                    $('#dialog_background_overlay').css('display', 'none');
                } else {
                    jAlert("Не заполнены обязательные поля", "Пожалуйста, заполни все обязательные поля")
                }
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');

    sendRequest({ mode: 'educ_program_info' }, (educ_info) => {
        $('#education-program').dxSelectBox({
            items: educ_info,
            disabled: is_owner != 'true'? true : false,
            displayExpr: 'name',
            valueExpr: 'id',
            value: ipr.cc_education_program_id,
            onSelectionChanged(e) {
                $(e.element).attr('educ_program_id', e.selectedItem.id);
            },
          });
    });

    $(function() {
        $("input:checkbox.chk-skill").each(function(){
            $(this).change(function(){
                $("input:checkbox.chk-skill").not($(this)).prop("checked", false);
                $(this).prop("checked", $(this).prop("checked"));
                $("#skill-descr").empty();

                if ($(this).prop("checked")) {
                    skillType = $(this).attr("skillType");
                    if (skillType == "soft") {
                        $("#skill-descr").dxToolbar({
                            items: [
                                {
                                    widget: "dxButton",
                                    location: "before",
                                    options: {
                                        text: 'Компетенция',
                                        width: (window.screen.width >= 775 ? "auto" : "19em"),
                                        disabled: is_owner != 'true'? true : false,
                                        onClick() {
                                            sendRequest({ mode: 'get_comptenece_360_unirest'}, (data) => {
                                                show('Список компетенций', 'competence', data.competence_ids, false, null, "name", "+");
                                            });
                                        },
                                    },
                                }, {
                                    widget: "dxTextBox",
                                    location: "before",
                                    options: {
                                        text: ipr.competence_name,
                                        disabled: true,
                                        elementAttr: { id: 'comp_name', competence_id: ipr.competence_id},
                                        width: "19em",
                                        height: "2.4em",
                                        onClick() {

                                        },
                                    },
                                }
                            ]
                        });
                    } else if (skillType == "hard") {
                        $('#skill-descr').append(`<textarea id='goal_desc' placeholder="Развитие не заполнено." class="autoresize" oninput="autoResize(this)">${ipr.description}</textarea>`)
                    }
                }
                if (is_owner != 'true') {
                    $('#ui_dialog').find('#goal_desc').attr('readonly', true);
                }
            });
        });

        $(`input[skilltype=${ipr.skill_type}]`).prop('checked', true);
        $(`input[skilltype=${ipr.skill_type}]`).trigger('change');
    });

    if (is_owner != 'true') {
        $('#ui_dialog').find('textarea, input[type="date"]').attr('readonly', true);
    }

    if (is_owner == 'true') {
        $('#ui_dialog').find('#goal_desc_comment_manager').attr('readonly', true);
    } else {
        $('#ui_dialog').find('#goal_desc_comment_manager').attr('readonly', false);
        $('#ui_dialog').find('.chk-skill').prop('disabled', true);
    }
}

function editPotencialDialog(rps) {
    is_owner = $('#year_selector option:selected').attr('is_owner');
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' data-goalmap-id ="${rps.goalmap_id ? rps.goalmap_id : $('#year_selector option:selected').attr('goalmap_id')}" class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <label>Потенциал сотрудника</label>
                <div class="wt-lp-dialog-fld" id="rps-dialog-lookup"></div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Редактировать потенциал сотрудника',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Сохранить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                id = $("#rps-dialog-lookup input[type='hidden'").attr('potential_coll_id');
                saveGAP({
                    id: rps.goalmap_id,
                    potencial_coll_id: id
                });
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');

    $('#rps-dialog-lookup').dxSelectBox({
        items: rps_list.potencial_coll,
        disabled: is_owner == 'true'? true : false,
        displayExpr: 'name',
        valueExpr: 'code',
        value: rps.potencial_coll_code,
        onSelectionChanged(e) {
            $("#rps-dialog-lookup input[type='hidden'").attr('potential_coll_id', e.selectedItem.id);
        },
    });
}

function editSkillDialog(rps) {
    is_owner = $('#year_selector option:selected').attr('is_owner');
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' data-goalmap-id ="${rps.goalmap_id ? rps.goalmap_id : $('#year_selector option:selected').attr('goalmap_id')}" class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <label>Уровень профессионализма</label>
                <div class="wt-lp-dialog-fld" id="rps-dialog-lookup"></div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Редактировать уровень профессионализма',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Сохранить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                id = $("#rps-dialog-lookup input[type='hidden'").attr('skill_level_id');
                saveGAP({
                    id: rps.goalmap_id,
                    skill_level_id: id
                });
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');

    $('#rps-dialog-lookup').dxSelectBox({
        items: rps_list.skill_level,
        disabled: is_owner == 'true'? true : false,
        displayExpr: 'name',
        valueExpr: 'code',
        value: rps.skill_level_code,
        onSelectionChanged(e) {
            $("#rps-dialog-lookup input[type='hidden'").attr('skill_level_id', e.selectedItem.id);
        },
    });
}

function editRiskDialog(rps) {
    is_owner = $('#year_selector option:selected').attr('is_owner');
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' data-goalmap-id ="${rps.goalmap_id ? rps.goalmap_id : $('#year_selector option:selected').attr('goalmap_id')}" class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <label>Риск ухода</label>
                <div class="wt-lp-dialog-fld" id="rps-dialog-lookup"></div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Редактировать риск ухода',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Сохранить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                id = $("#rps-dialog-lookup input[type='hidden'").attr('escape_risk_id');
                saveGAP({
                    id: rps.goalmap_id,
                    escape_risk_id: id
                });
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');

    $('#rps-dialog-lookup').dxSelectBox({
        items: rps_list.escape_risk,
        disabled: is_owner == 'true'? true : false,
        displayExpr: 'name',
        valueExpr: 'code',
        value: rps.escape_risk_code,
        onSelectionChanged(e) {
            $("#rps-dialog-lookup input[type='hidden'").attr('escape_risk_id', e.selectedItem.id);
        },
    });
}

function editСurSalaryDialog(goalmap) {
    is_owner = $('#year_selector option:selected').attr('is_owner');
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' data-goalmap-id ="${goalmap.goalmap_id ? goalmap.goalmap_id : $('#year_selector option:selected').attr('goalmap_id')}" class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <label>Текущий уровень заработной платы</label>
                <textarea class="wt-lp-dialog-fld goal-desc" id="rps-dialog-fld">${goalmap.current_salary ? goalmap.current_salary : ''}</textarea>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Редактировать текущий уровень заработной платы',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Сохранить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                salary = $('#rps-dialog-fld').val();
                numSalary = Number(salary);

                if (isNaN(numSalary) || numSalary < 0 || !Number.isInteger(numSalary)) {
                    jAlert('Ошибка при изменении', 'Невозможно изменить пункт: желаемый уровень заработной платы. Проверьте корректность введенных данных.');
                    return;
                }

                saveGAP({
                    id: goalmap.goalmap_id,
                    current_salary: salary
                });
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}

function editWantSalaryDialog(goalmap) {
    is_owner = $('#year_selector option:selected').attr('is_owner');
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' data-goalmap-id ="${goalmap.goalmap_id ? goalmap.goalmap_id : $('#year_selector option:selected').attr('goalmap_id')}" class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <label>Желаемый уровень заработной платы</label>
                <textarea class="wt-lp-dialog-fld goal-desc" id="rps-dialog-fld">${goalmap.want_salary ? goalmap.want_salary : ''}</textarea>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Редактировать желаемый уровень заработной платы',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Сохранить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                salary = $('#rps-dialog-fld').val();
                numSalary = Number(salary);

                if (isNaN(numSalary) || numSalary < 0 || !Number.isInteger(numSalary)) {
                    jAlert('Ошибка при изменении', 'Невозможно изменить пункт: желаемый уровень заработной платы. Проверьте корректность введенных данных.');
                    return;
                }

                saveGAP({
                    id: goalmap.goalmap_id,
                    want_salary: salary
                });
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}

function editCommGrowDialog(goalmap) {
    is_owner = $('#year_selector option:selected').attr('is_owner');
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' data-goalmap-id ="${goalmap.goalmap_id ? goalmap.goalmap_id : $('#year_selector option:selected').attr('goalmap_id')}" class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <label>Комментарий сотрудника</label>
                <textarea class="wt-lp-dialog-fld goal-desc" id="rps-dialog-fld">${goalmap.comment_by_grow ? goalmap.comment_by_grow : ''}</textarea>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Редактировать комментарий сотрудника',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Сохранить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {

                saveGAP({
                    id: goalmap.goalmap_id,
                    comment_by_grow: $('#rps-dialog-fld').val()
                });
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}

function editCommManagGrowDialog(goalmap) {
    is_owner = $('#year_selector option:selected').attr('is_owner');
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' data-goalmap-id ="${goalmap.goalmap_id ? goalmap.goalmap_id : $('#year_selector option:selected').attr('goalmap_id')}" class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <label>Комментарий руководителя</label>
                <textarea class="wt-lp-dialog-fld goal-desc" id="rps-dialog-fld">${goalmap.comment_manager_by_grow ? goalmap.comment_manager_by_grow : ''}</textarea>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Редактировать комментарий руководителя',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Сохранить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {

                saveGAP({
                    id: goalmap.goalmap_id,
                    comment_manager_by_grow: $('#rps-dialog-fld').val()
                });
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}

function addOKRDialog() {
    is_owner = $('#year_selector option:selected').attr('is_owner');
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <div class="header-description-block">
					<label style="font-size: 1.7rem; color: #000; padding: 2rem 0 1rem 0;">Название OKR</label>
                    <div class="goal-help" onclick="jAlertOKR()"></div>
				</div>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc' placeholder="Название OKR не заполнено." class="autoresize" oninput="autoResize(this)"></textarea>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Срок выполнения</label>
                <div class="wt-lp-dialog-fld">
                    <input type="date" id="goal_plan_date"></input>
                </div>
            </div>

			<div class="wt-lp-dialog-fld-container">
                <label>Мой вклад в OKR</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_action' placeholder="План действий не заполнен." class="autoresize" oninput="autoResize(this)"></textarea>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Комментарий сотрудника</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_coll' class="autoresize" oninput="autoResize(this)"></textarea>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Комментарий руководителя</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_manager' class="autoresize" oninput="autoResize(this)"></textarea>
                </div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Добавление OKR',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Добавить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                okr_desc = $('#ui_dialog').find('#goal_desc').val();
                if (!okr_desc) {
                    jAlert('Ошибка при добавлении', 'Невозможно добавить новый OKR. Поле «Название OKR» является обязательным к заполнению.');
                    return;
                }

                goalmap_id = $('#year_selector option:selected').attr('goalmap_id');
                okr_plan_date = $('#ui_dialog').find('#goal_plan_date').val();
                okr_actions = $('#ui_dialog').find('#goal_action').val();
                desc_comment_coll = $('#ui_dialog').find('#goal_desc_comment_coll').val();
                desc_comment_manager = $('#ui_dialog').find('#goal_desc_comment_manager').val();
                if (okr_desc && okr_plan_date && okr_actions) {
                    saveOkr({
                        goalmap_id: goalmap_id,
                        description: okr_desc,
                        plan_date: okr_plan_date,
                        actions: okr_actions,
                        desc_comment_coll: desc_comment_coll,
                        desc_comment_manager: desc_comment_manager
                    });
                    $('#ui_dialog').remove();
                    $('#dialog_background_overlay').css('display', 'none');
                }
                else {
                    jAlert("Не заполнены обязательные поля", "Пожалуйста, заполни все обязательные поля")
                }


            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');

    if (is_owner == 'true') {
        $('#ui_dialog').find('#goal_desc_comment_manager').attr('readonly', true);
    } else {
        $('#ui_dialog').find('#goal_desc_comment_coll').attr('readonly', true);
    }
}

function showOKRDescDialog(okr) {
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <div class="header-description-block">
					<label style="font-size: 1.7rem; color: #000; padding: 2rem 0 1rem 0;">Название OKR</label>
                    <div class="goal-help" onclick="jAlertOKR()"></div>
				</div>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc' placeholder="Название OKR не заполнено." readonly class="autoresize" oninput="autoResize(this)">${okr.description}</textarea>

                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Срок выполнения</label>
                <div class="wt-lp-dialog-fld">
                    <input type="date" id="goal_plan_date" value="${convertDate(okr.plan_date)}" readonly></input>
                </div>
            </div>

			<div class="wt-lp-dialog-fld-container">
                <label>Мой вклад в OKR</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_action' placeholder="План действий не заполнен." readonly class="autoresize" oninput="autoResize(this)">${okr.actions ? okr.actions : ''}</textarea>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Комментарий сотрудника</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_coll' readonly class="autoresize" oninput="autoResize(this)">${okr.desc_comment_coll ? okr.desc_comment_coll : ''}</textarea>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Комментарий руководителя</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_manager' readonly class="autoresize" oninput="autoResize(this)">${okr.desc_comment_manager ? okr.desc_comment_manager : ''}</textarea>
                </div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Просмотр OKR',
        width: '50%',
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
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}

function dropOkrDialog(okr) {
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <div class="header-description-block">
					<label style="font-size: 1.7rem; color: #000; padding: 2rem 0 1rem 0;">OKR «${okr.description}» будет удален. Ты уверен, что хочешь продолжить?</label>
				</div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Удаление OKR',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Подтвердить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                dropOkr({
                    id: okr.id
                });
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}

function editOkrResultDialog(okr) {
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' okr_id='${okr.id}' class="wt-lp-dialog-body">
            <br>
            <div id='dialog_tabs_buttons' class='dialog-tabs-buttons'></div>
            <div id='dialog_tabs' class='dialog-tabs'></div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Редактирование результата OKR',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Сохранить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                var dataY1before = {
                    y1_result: okr.y1_result,
                    y1_comment: okr.y1_comment,
                    y1_comment_manager: okr.y1_comment_manager
                };
                var goalmapObj = $('#year_selector option:selected');
                var is_approved_y1 = goalmapObj.attr('is_approved_y1') == 'true';

                var commentQ1 = $('#ui_dialog #y1_comment').val();
                var resultQ1 = $('#ui_dialog #y1_result').val();

                var commentQ2 = $('#ui_dialog #y2_comment').val();
                var resultQ2 = $('#ui_dialog #y2_result').val();

                if (!commentQ1 && resultQ1 != undefined && goalmapObj.attr('is_owner') == 'true' && !is_approved_y1) {
                    jAlert("Не заполнены обязательные поля", "Пожалуйста, внеси комментарий к своей оценке результата")
                    return;
                }

                if ((!commentQ2 && resultQ2 != undefined && goalmapObj.attr('is_owner') == 'true')) {
                    jAlert("Не заполнены обязательные поля", "Пожалуйста, внеси комментарий к своей оценке результата")
                    return;
                }

                var commentManagerQ1 = $('#ui_dialog #y1_comment_manager').val();
                var commentManagerQ2 = $('#ui_dialog #y2_comment_manager').val();

                var currentY1data = { y1_result: resultQ1, y1_comment: commentQ1, y1_comment_manager: commentManagerQ1 }

                if (
                    JSON.stringify(currentY1data) !== JSON.stringify(dataY1before) &&
                    goalmapObj.attr('is_approved_y1') == 'true'
                ) {

                }
                if (((resultQ1 != undefined && !isNaN(+resultQ1) && +resultQ1 >= 0 && +resultQ1 <= 100) || resultQ1 == undefined) &&
                    ((resultQ2 != undefined && !isNaN(+resultQ2) && +resultQ2 >= 0 && +resultQ2 <= 100) || resultQ2 == undefined)) {
                    saveOkr({
                        id: okr.id,
                        y1_result: resultQ1 == undefined && !!commentQ1 ? null : resultQ1,
                        y2_result: resultQ2 == undefined && !!commentQ2 ? null : resultQ2,

                        y1_comment: commentQ1,
                        y2_comment: commentQ2,
                        y1_comment_manager: commentManagerQ1,
                        y2_comment_manager: commentManagerQ2,
                    });

                    if (is_approved_y1 && (dataY1before.y1_result != currentY1data.y1_result)) {
                        updateGoalmapInfoRequest();
                        updateAllGoals();
                        updateAllOKRs();
                        updateAllIPRs();
                        updatePermissionRules();
                    }

                    $('#ui_dialog').remove();
                    $('#dialog_background_overlay').css('display', 'none');
                }
                else {
                    jAlert("Ошибка при сохранении", "Результат OKR должен быть в диапазоне от 0 до 100.")
                }
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    var only1HalfYear = $('#year_selector option:selected').attr('is_ready_approved_y2') != 'true';
    var count = only1HalfYear ? 1 : 2
    for (number = 1; number <= count; number++) {
        $('#dialog_tabs_buttons').append(`
            <button id='button_tab_y${number}' class='tab-button' tab_number='${number}' onclick='enableDialogTab(undefined, this)'>
				${number == 1 ? 'Промежуточная оценка' : 'Итоговая годовая оценка'}
			</button>
        `)

        $('#dialog_tabs').append(`
            <div id='tab_y${number}' tab_number='${number}' class='dialog-tab'>
                <div class="wt-lp-dialog-fld-container">
                    <label>Описание:</label>
                    <div class="wt-lp-dialog-fld">
                        <textarea id="goal_desc" disabled class="autoresize" oninput="autoResize(this)">${okr.actions}</textarea>
                    </div>
                </div>
                <div class="wt-lp-dialog-fld-container">
                    <label>Результат (в % от 1 до 100)</label>
                    <div class="wt-lp-dialog-fld">
                        <input id='y${number}_result' number='${number}'></input>
                    </div>
                </div>
                <div class="wt-lp-dialog-fld-container">
                    <label>Комментарий сотрудника:</label>
                    <div class="wt-lp-dialog-fld">
                        <textarea id='y${number}_comment' class="autoresize" oninput="autoResize(this)">${okr[`y${number}_comment`]}</textarea>
                    </div>
                </div>
				<div class="wt-lp-dialog-fld-container">
					<label>Комментарий руководителя:</label>
                    <div class="wt-lp-dialog-fld">
                        <textarea id='y${number}_comment_manager' class="autoresize" oninput="autoResize(this)">${okr[`y${number}_comment_manager`]}</textarea>
                    </div>
                </div>
            </div>
        `)
    }
    if (okr.y1_result != null) {
        $('#ui_dialog #y1_result').val(okr.y1_result)
    }
    if (okr.y2_result != null) {
        $('#ui_dialog #y2_result').val(okr.y2_result)
    }
    sendRequest({ mode: 'goal_results' }, (okr_results) => {
        tabSelects = $('#dialog_tabs').find('select');
        tabSelects.append(`<option></option>`);

        okr_results.forEach(okr_result => {
            tabSelects.each((index, tabSelect) => {
                number = $(tabSelect).attr('number');
                optionIsSelected = okr[`y${number}_result`] == okr_result.id;
                option = $(tabSelect).append(`<option okr_result_id="${okr_result.id}" ${optionIsSelected ? 'selected' : ''}>${okr_result.name}</option>`)
            })
        });
    });

    select_elems = $('#dialog_tabs').find('select');

    editUnlockQuarterFields();
    enableDialogTab(1);

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}

function editOKRDescDialog(okr) {
    is_owner = $('#year_selector option:selected').attr('is_owner');
    $('#dialog_background_overlay').css('display', 'block');
    $(`
        <div id='ui_dialog' class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <div class="header-description-block">
					<label style="font-size: 1.7rem; color: #000; padding: 2rem 0 1rem 0;">Название OKR</label>
                    <div class="goal-help" onclick="jAlertOKR()"></div>
				</div>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc' placeholder="Название OKR не заполнено." class="autoresize" oninput="autoResize(this)">${okr.description}</textarea>

                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Срок выполнения</label>
                <div class="wt-lp-dialog-fld">
                    <input type="date" id="goal_plan_date" value="${convertDate(okr.plan_date)}"></input>
                </div>
            </div>

			<div class="wt-lp-dialog-fld-container">
                <label>Мой вклад в OKR</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_action' placeholder="План действий не заполнен." class="autoresize" oninput="autoResize(this)">${okr.actions ? okr.actions : ''}</textarea>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Комментарий сотрудника</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_coll' class="autoresize" oninput="autoResize(this)">${okr.desc_comment_coll ? okr.desc_comment_coll : ''}</textarea>
                </div>
            </div>
			<div class="wt-lp-dialog-fld-container">
                <label>Комментарий руководителя</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='goal_desc_comment_manager' class="autoresize" oninput="autoResize(this)">${okr.desc_comment_manager ? okr.desc_comment_manager : ''}</textarea>
                </div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Редактирование OKR',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Сохранить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                okr_desc = $('#ui_dialog').find('#goal_desc').val();
                if (!okr_desc) {
                    jAlert('Ошибка при редактировании', 'Невозможно сохранить изменения. Поле «Название OKR» является обязательным к заполнению.');
                    return;
                }

                okr_plan_date = $('#ui_dialog').find('#goal_plan_date').val();
                okr_actions = $('#ui_dialog').find('#goal_action').val();
                desc_comment_coll = $('#ui_dialog').find('#goal_desc_comment_coll').val();
                desc_comment_manager = $('#ui_dialog').find('#goal_desc_comment_manager').val();
                if (okr_desc && okr_plan_date && okr_actions) {
                    saveOkr({
                        id: okr.id,
                        description: okr_desc,
                        plan_date: okr_plan_date,
                        actions: okr_actions,
                        desc_comment_coll: desc_comment_coll,
                        desc_comment_manager: desc_comment_manager
                    });
                    $('#ui_dialog').remove();
                    $('#dialog_background_overlay').css('display', 'none');
                }
                else {
                    jAlert("Не заполнены обязательные поля", "Пожалуйста, заполни все обязательные поля")
                }
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');

    if (is_owner != 'true') {
        $('#ui_dialog').find('textarea, input[type="date"]').attr('readonly', true);
    }

    if (is_owner == 'true') {
        $('#ui_dialog').find('#goal_desc_comment_manager').attr('readonly', true);
    } else {
        $('#ui_dialog').find('#goal_desc_comment_manager').removeAttr('readonly');
    }
}

function jAlert(header, message, isRemoveBackground = false) {
    $('#dialog_background_overlay').css('display', 'block');
    id = (Math.random() + 1).toString(36).substring(7);
    jDialog = $(`
        <div id='ui_dialog`+ id + `' class='wt-lp-dialog-alert'>
            <div class='wt-lp-info alert-icon'></div>
            <div class='wt-lp-alert-main-content'>
                <div class='wt-lp-dialog-text-container'>${message}</div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: header,
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-main-info ui-dialog-buttons wt-lp-wrapper-dialog",
        buttons: [{
            text: 'ОК',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                $('#ui_dialog' + id).remove();
                if (isRemoveBackground) {
                    $('#dialog_background_overlay').css('display', 'none');
                }
            }
        }]
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
    jDialog.find('.ui-dialog-titlebar').find('.ui-dialog-titlebar-close').css('display', 'none');
}

function returnToWorkDialog() {
    $('#dialog_background_overlay').css('display', 'block');

    $(`
        <div id='ui_dialog' class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <label>Комментарий</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='comment_manager' class="autoresize" oninput="autoResize(this)"></textarea>
                </div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Вернуть на доработку',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'ОК',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                returnToWork($('#comment_manager').val())
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}
function ApproveOnlyCommentDialog() {
    $('#dialog_background_overlay').css('display', 'block');

    $(`
        <div id='ui_dialog' class="wt-lp-dialog-body">
            <div class="wt-lp-dialog-fld-container">
                <label>Комментарий</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='comment_manager' class="autoresize" oninput="autoResize(this)"></textarea>
                </div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Подтверждение',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'ОК',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                approveWithComment($('#comment_manager').val())
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}
function approveDialog() {
    fields = $('#potencial_coll_lable, #skill_level_label, #escape_risk_label, #comment_manager_by_grow_label')
    for (i = 0; i < fields.length; i++) {
        if (!fields[i].innerHTML) {
            jAlert("Не заполнены обязательные поля", "Пожалуйста, заполни все обязательные поля", true)
            return;
        }
    }

    if (!permissionRules.approve_by_halfyear) {
        ApproveOnlyCommentDialog()
        return;
    }
    var arrSaveButtons = [];
    goalmapElem = $('#year_selector option:selected')[0];
    is_approved_y1 = goalmapElem.getAttribute('is_approved_y1') == 'true'
    is_approved_y2 = goalmapElem.getAttribute('is_approved_y2') == 'true'
    is_ready_approved_y2 = goalmapElem.getAttribute('is_ready_approved_y2') == 'true'

    if (!is_approved_y1) {
        arrSaveButtons = [...arrSaveButtons, {
            text: 'Согласовать промежуточную оценку',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                approve({
                    id: $('#year_selector option:selected').attr('goalmap_id'),
                    is_approved_y1: true
                },
                    $('#comment').val(),
                )
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }]
    }

    if (is_approved_y1 && !is_approved_y2 && is_ready_approved_y2) {
        arrSaveButtons = [...arrSaveButtons, {
            text: 'Согласовать итоговую оценку',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                approve({
                    id: $('#year_selector option:selected').attr('goalmap_id'),
                    is_approved_y2: true,
                },
                    $('#comment').val(),
                )
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }]
    }

    $('#dialog_background_overlay').css('display', 'block');

    $(`
        <div id='ui_dialog' class="wt-lp-dialog-body">
            <br>
            <div class="wt-lp-dialog-fld-container">
				<div class="wt-lp-dialog-fld-container">
					<label>Комментарий</label>
					<div class="wt-lp-dialog-fld">
						<textarea id='comment' class="autoresize" oninput="autoResize(this)"></textarea>
					</div>
				</div>

            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Подтверждение',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, ...arrSaveButtons],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}

function show(title, catalog, disp_object_ids, m_sel, action, list_columns = '', sort_field_name = "fullname", sort_direct = "+") {
    var pars = new Object();
    pars.title = title;
    var strAttr = "status:no;dialogWidth:750px;dialogHeight:580px;help:no";

    pars.elemNamesArray = Array();

    xShowDialog('custom_dlg_select_inline.html',
        {
            "catalog_name": catalog,
            "multi_select": m_sel,
            "can_be_empty": "true",
            "disp_filter": "false",
            "check_access": "false",
            "display_object_ids": disp_object_ids,
            "sort_field_name": sort_field_name,
            "sort_direct": sort_direct,
            "list_columns": list_columns,
        },
        {
            height: 550,
            width: 750,
            minHeight: 400,
            minWidth: 550,
            after_open: function () {
                getElems();
                setDivHeight();
                $(".ui-dialog-title:eq(1)").prepend("<div style='text-align: left; display: inline-block; font-weight: bold'>" + title + "</div><style>.ui-dialog-title {text-align: left;}</style>");
            },
            resizeStop: function (event, ui) {
                setDivHeight();
            }
        },
        function (oParams) {
            id_mas = oParams.selected_object_ids.split(";");

            if (!oParams.handle) return null;

            names = "";
            ids = "";
            id_ar = oParams.selected_object_ids.split(";");
            isFirst = true;
            for (i = 0; i < id_ar.length; i++) {
                if (id_ar[i] == "" || id_ar[i] == null) continue;
                ids += (isFirst ? '' : ',') + id_ar[i];
                isFirst = false;
            }
            for (i = 0; i < oParams.elemNamesArray.length; i++) {
                if (oParams.elemNamesArray[i] != null)
                    names += (i != 0 ? "|" : "") + oParams.elemNamesArray[i];
            }

            if (catalog == "competence") {
                comp_name_input_elem = $('#comp_name').find('input');
                comp_name_input_elem.val(names);
                $('#comp_name').attr("competence_id", ids.split(",").shift())
            }
            if (action != null || action != undefined) {
                action(ids);
            }
        });
}

function updateOKRS(okrs) {
    okrs_elem = $('#okrs');

    if (!okrs_elem || without_okrs) {
        return;
    }

    okrs_elem.empty();
    goalmapElem = $('#year_selector option:selected')[0];
    is_approved_y1 = goalmapElem.getAttribute('is_approved_y1') == 'true';
    is_ready_approved_y2 = goalmapElem.getAttribute('is_ready_approved_y2') == 'true';

    okrs.forEach(okr => {
        checkedBaseGoal = (okr[`y1_result`] != undefined && !is_approved_y1) || (okr[`y2_result`] != undefined && is_ready_approved_y2);

        okr_elem = $(`
            <div class="goal" okr_id="${okr.id}" baseGoal ${checkedBaseGoal ? 'checkedBaseGoal' : ''}>
                <div class="goal-header-body">
                    <div class="goal-header">
                        <div class="goal-header-text" title="${okr.description}">${okr.description}</div>
                    </div>
                    <div class="goal-buttons">
                        <button id="button_edit_desc" class="goal-edit-button">Редактировать</button>
                        <button id="button_show_desc" class="goal-edit-button">Посмотреть</button>
                        <button id="button_drop" class="goal-edit-button">Удалить</button>
                    </div>
                </div>
                <div class="goal-desc-body">
                    <div class="goal-desc" placeholder="План действий не заполнен."></div>
                    <div class="goal-plan-date">
                        <div class="goal-plan-date-header">Плановый срок:</div>
                        <div class="goal-plan-date-value">${okr.plan_date_str}</div>
                    </div>
                </div>
                <div class="goal-result-header-body">
                    <div class="goal-header-result">
                        <div class="goal-header-text">Оценка результата</div>
                    </div>
                    <div class="goal-buttons">
                        <button id="button_edit_result" class="goal-edit-button">Оценить результат</button>
                    </div>
                </div>
                <div class="goal-result-body">
                    <div class="goal-result" placeholder="Результаты цели не заполнены."></div>
                </div>
            </div>
        `);

        okr_results_elem = okr_elem.find('.goal-result');

        for (number = 1; number <= 2; number++) {
            if (okr[`y${number}_result`] == null) {
                continue;
            }

            okr_results_elem.append(`
                <div class="goal-result-main-header">${number == 1 ? 'Промежуточная оценка' : 'Итоговая годовая оценка'}</div>
                <div class="goal-result-value-body">
                    <div class="goal-result-value-row">
                        <div class="goal-result-sub-header">Результат (%):</div>
                        <div class="goal-result-value">${okr[`y${number}_result`]}</div>
                    </div>
                    <div class="goal-result-value-row" style='display: ${!okr[`y${number}_comment`] ? 'none' : ''}'>
                        <div class="goal-result-sub-header">Комментарий сотрудника:</div>
                        <div class="goal-result-value">${okr[`y${number}_comment`]}</div>
                    </div>
                    <div class="goal-result-value-row" style='display: ${!okr[`y${number}_comment_manager`] ? 'none' : ''}'>
                        <div class="goal-result-sub-header">Комментарий руководителя:</div>
                        <div class="goal-result-value">${okr[`y${number}_comment_manager`]}</div>
                    </div>
                </div>
            `);
        }

        okr_desc_elem = okr_elem.find('.goal-desc');

        okr_desc_elem.append(`
            <div class="goal-desc-value-body">
                <div class="goal-desc-value-row">
                    <div class="goal-desc-value" style="padding-left: 0em;">${okr.actions}</div>
                </div>
                <div class="goal-desc-value-row" style='display: ${!okr.desc_comment_coll ? 'none' : ''}'>
                    <div class="goal-desc-sub-header">Комментарий сотрудника:</div>
                    <div class="goal-desc-value">${okr.desc_comment_coll}</div>
                </div>
                <div class="goal-desc-value-row" style='display: ${!okr.desc_comment_manager ? 'none' : ''}'>
                    <div class="goal-desc-sub-header">Комментарий руководителя:</div>
                    <div class="goal-desc-value">${okr.desc_comment_manager}</div>
                </div>
            </div>
        `)

        sendRequest({ mode: 'permission_rules', goalmap_id: $('#year_selector option:selected').attr('goalmap_id') },
            (rules) => {
                if (rules.approve && !rules.edit_result_main) {
                    okr_elem.find("#button_edit_desc").text("Добавить комментарии");
                }
            });

        okr_elem.find('#button_edit_desc').click(function () {
            editOKRDescDialog(okr)
        });

        okr_elem.find('#button_show_desc').click(function () {
            showOKRDescDialog(okr);
        });

        okr_elem.find('#button_drop').click(function () {
            dropOkrDialog(okr);
        });

        okr_elem.find('#button_edit_result').click(function () {
            editOkrResultDialog(okr);
        });


        okrs_elem.append(okr_elem);
    });

    if (okrs.length == 0) {
        okrs_elem.append("<div class='goal goal-empty-data'>Нет данных</div>")
    }
}

function updateIPRS(iprs) {
    iprs_elem = $('#iprs');
    iprs_elem.empty();
    goalmapElem = $('#year_selector option:selected')[0];
    is_approved_y1 = goalmapElem.getAttribute('is_approved_y1') == 'true'
    is_ready_approved_y2 = goalmapElem.getAttribute('is_ready_approved_y2') == 'true'

    iprs.forEach(ipr => {
        ipr_elem = $(`
            <div class="goal" baseGoal ${(ipr[`y1_result`] && !is_approved_y1) || (ipr[`y2_result`] && is_ready_approved_y2) ? 'checkedBaseGoal' : ''}>
                <div class="goal-header-body">
                    <div class="goal-header">
                        <div class="goal-header-text" title="Что буду развивать">${ipr.title}</div>
                    </div>
                    <div class="goal-buttons">
                        <button id="button_edit_desc" class="goal-edit-button">Редактировать</button>
                        <button id="button_show_desc" class="goal-edit-button">Посмотреть</button>
                        <button id="button_drop" class="goal-edit-button">Удалить</button>
                    </div>
                </div>
                <div class="goal-desc-body">
                    <div class="goal-desc" placeholder="Развитие не заполнено."></div>
                    <div class="goal-plan-date">
                        <div class="goal-plan-date-header">Плановый срок:</div>
                        <div class="goal-plan-date-value">${ipr.plan_date_str}</div>
                    </div>
                </div>
                <div class="goal-result-header-body">
                    <div class="goal-header-result">
                        <div class="goal-header-text">Оценка результата</div>
                    </div>
                    <div class="goal-buttons">
                        <button id="button_edit_result" class="goal-edit-button">Оценить результат</button>
                    </div>
                </div>
                <div class="goal-result-body">
                    <div class="goal-result" placeholder="Результаты цели не заполнены."></div>
                </div>
            </div>
        `);

        ipr_results_elem = ipr_elem.find('.goal-result');

        for (number = 1; number <= 2; number++) {
            if (!ipr[`y${number}_result_name`]) {
                continue;
            }

            ipr_results_elem.append(`
                <div class="goal-result-main-header">${number == 1 ? 'Промежуточная оценка' : 'Итоговая годовая оценка'}</div>
                <div class="goal-result-value-body">
                    <div class="goal-result-value-row">
                        <div class="goal-result-sub-header">Результат:</div>
                        <div class="goal-result-value">${ipr[`y${number}_result_name`]}</div>
                    </div>
                    <div class="goal-result-value-row" style='display: ${!ipr[`y${number}_comment`] ? 'none' : ''}'>
                        <div class="goal-result-sub-header">Комментарий сотрудника:</div>
                        <div class="goal-result-value">${ipr[`y${number}_comment`]}</div>
                    </div>
					<div class="goal-result-value-row" style='display: ${!ipr[`y${number}_comment_manager`] ? 'none' : ''}'>
                        <div class="goal-result-sub-header">Комментарий руководителя:</div>
                        <div class="goal-result-value">${ipr[`y${number}_comment_manager`]}</div>
                    </div>
                </div>
            `)
        }

        ipr_desc_elem = ipr_elem.find('.goal-desc');

        ipr_desc_elem.append(`
            <div class="goal-desc-value-body">
                <div class="goal-desc-value-row">
                    <div class="goal-desc-value" style="padding-left: 0em;">${ipr.actions}</div>
                </div>
                <div class="goal-desc-value-row" style='display: ${!ipr.desc_comment_coll ? 'none' : ''}'>
                    <div class="goal-desc-sub-header">Комментарий сотрудника:</div>
                    <div class="goal-desc-value">${ipr.desc_comment_coll}</div>
                </div>
                <div class="goal-desc-value-row" style='display: ${!ipr.desc_comment_manager ? 'none' : ''}'>
                    <div class="goal-desc-sub-header">Комментарий руководителя:</div>
                    <div class="goal-desc-value">${ipr.desc_comment_manager}</div>
                </div>
            </div>
        `)

        sendRequest({ mode: 'permission_rules', goalmap_id: $('#year_selector option:selected').attr('goalmap_id') },
            (rules) => {
                if (rules.approve && !rules.edit_result_main) {
                    ipr_elem.find("#button_edit_desc").text("Добавить комментарии");
                }
            });

        ipr_elem.find('#button_edit_desc').click(function () {
            editIPRDialog(ipr);
        });

        ipr_elem.find('#button_show_desc').click(function () {
            showIPRDialog(ipr);
        });

        ipr_elem.find('#button_drop').click(function () {
            dropIPRDialog(ipr);
        });

        ipr_elem.find('#button_edit_result').click(function () {
            editIPRResultDialog(ipr);
        });

        iprs_elem.append(ipr_elem);
    });

    if (iprs.length == 0) {
        iprs_elem.append("<div class='goal goal-empty-data'>Нет данных</div>")
    }
}

function updateGAP(goalmap) {
    is_owner = $('#year_selector option:selected').attr('is_owner');
    gap_elem = $('#gap');
    gap_elem.empty();
    perc_inc = undefined;

    if (goalmap.current_salary && goalmap.want_salary) {
        perc_inc = Math.round((((goalmap.want_salary - goalmap.current_salary)/goalmap.current_salary)*100)*100)/100
    }

    gap_elem.append( $(`
        <div class="goal goal-potential">
            <div class="goal-potential-potential-block">
                <div class="goal-header-body">
                    <div class="goal-header">
                        <div class="goal-header-text">Потенциал сотрудника</div>
                    </div>
                    <div class="goal-buttons">
                        <button id="button_edit_potenc" class="goal-edit-button">Редактировать</button>
                    </div>
                </div>
                <div class="goal-desc-body">
                    <div class="goal-desc" id="potencial_coll_lable" placeholder="Обязательное для заполнения поле">${goalmap.potencial_coll_name}</div>
                </div>
            </div>

            <div class="goal-potential-current-salary-block">
                <div class="goal-header-body">
                    <div class="goal-header">
                        <div class="goal-header-text">Текущий уровень заработной платы</div>
                    </div>
                    <div class="goal-buttons">
                        <button id="button_edit_cur_salary" class="goal-edit-button">Редактировать</button>
                    </div>
                </div>
                <div class="goal-desc-body">
                    <div class="goal-desc" id="current_salary_label" placeholder="Обязательное для заполнения поле">${goalmap.current_salary ? goalmap.current_salary :''}</div>
                </div>
            </div>

           <div class="goal-potential-prof-block">
                <div class="goal-header-body">
                    <div class="goal-header">
                        <div class="goal-header-text">Уровень профессионализма</div>
                    </div>
                    <div class="goal-buttons">
                        <button id="button_edit_skill" class="goal-edit-button">Редактировать</button>
                    </div>
                </div>
                <div class="goal-desc-body">
                    <div class="goal-desc" id="skill_level_label" placeholder="Обязательное для заполнения поле">${goalmap.skill_level_name}</div>
                </div>
            </div>

            <div class="goal-potential-want-salary-block">
                <div class="goal-header-body">
                    <div class="goal-header">
                        <div class="goal-header-text">Желаемый уровень заработной платы</div>
                    </div>
                    <div class="goal-buttons">
                        <button id="button_edit_want_salary" class="goal-edit-button">Редактировать</button>
                    </div>
                </div>
                <div class="goal-desc-body">
                    <div class="goal-desc" id="want_salary_label" placeholder="Обязательное для заполнения поле">${goalmap.want_salary ? goalmap.want_salary :''}</div>
                </div>
                <div class="goal-header-body">
                    <div class="goal-header">
                        <div class="goal-header-text goal-header-text-salary-counter">Процент увеличения: ${isNull(perc_inc) ? 'Для отображения заполни поля «Текущий уровень заработной платы» и «Желаемый уровень заработной платы»' : '<label style="font-weight: 400">'+perc_inc + '%</label>'}</div>
                    </div>
                </div>
            </div>

       


            <div class="goal-potential-comment-coworker-block">
                <div class="goal-header-body">
                    <div class="goal-header">
                        <div class="goal-header-text">Комментарий сотрудника</div>
                    </div>
                    <div class="goal-buttons" style='display: ${is_owner == 'false' ? 'none !important' : ''}'>
                        <button id="button_edit_comm_grow" class="goal-edit-button">Редактировать</button>
                    </div>
                </div>
                <div class="goal-desc-body">
                    <div class="goal-desc" id="comment_by_grow_label" placeholder="Обязательное для заполнения поле">${goalmap.comment_by_grow}</div>
                </div>
            </div>

            <div class="goal-potential-comment-manager-block">

                <div class="goal-header-body" style='display: ${is_owner == 'true' ? 'none !important' : ''}'>
                    <div class="goal-header">
                        <div class="goal-header-text">Риск ухода</div>
                    </div>
                    <div class="goal-buttons">
                        <button id="button_edit_risk" class="goal-edit-button">Редактировать</button>
                    </div>
                </div>
                <div class="goal-desc-body" style='display: ${is_owner == 'true' ? 'none !important' : ''}'>
                    <div class="goal-desc" id="escape_risk_label" placeholder="Обязательное для заполнения поле">${goalmap.escape_risk_name}</div>
                </div>

            </div>
            <div class="goal-potential-comment-namager-block">
                <div class="goal-header-body" style='display: ${is_owner == 'true' ? 'none !important' : ''}'>
                    <div class="goal-header">
                        <div class="goal-header-text">Комментарий руководителя</div>
                    </div>
                    <div class="goal-buttons">
                        <button id="button_edit_comm_manager_grow" class="goal-edit-button">Редактировать</button>
                    </div>
                </div>
                <div class="goal-desc-body" style='display: ${is_owner == 'true' ? 'none !important' : ''}'>
                    <div class="goal-desc" id="comment_manager_by_grow_label" placeholder="Обязательное для заполнения поле">${goalmap.comment_manager_by_grow}</div>
                </div>
            </div>
        </div>
    `));

    gap_elem.find('#button_edit_potenc').click(function () {
        editPotencialDialog(goalmap);
    });

    gap_elem.find('#button_edit_skill').click(function () {
        editSkillDialog(goalmap);
    });

    gap_elem.find('#button_edit_risk').click(function () {
        editRiskDialog(goalmap);
    });

    gap_elem.find('#button_edit_cur_salary').click(function () {
        editСurSalaryDialog(goalmap);
    });

    gap_elem.find('#button_edit_want_salary').click(function () {
        editWantSalaryDialog(goalmap);
    });

    gap_elem.find('#button_edit_comm_grow').click(function () {
        editCommGrowDialog(goalmap);
    });

    gap_elem.find('#button_edit_comm_manager_grow').click(function () {
        editCommManagGrowDialog(goalmap);
    });

}

function editFinalGoalResultDialog() {
    $('#dialog_background_overlay').css('display', 'block');
    goalmap = {
        id: $('#year_selector option:selected').attr('goalmap_id'),
        finish_goals_mark: current_final_mark_id
    }

    $(` <div id='ui_dialog' class="wt-lp-dialog-body">
            <br>
            <div id='dialog_tabs' class='dialog-tabs'>
            <div class="wt-lp-dialog-fld-container">
                    <label>Результат</label>
                    <div class="wt-lp-dialog-fld">
                        <select id='final_mark_result' number='1'></select>
                    </div>
                </div>
            </div>
        </div>
    `).dialog({
        resizable: false,
        draggable: false,
        title: 'Общая оценка выполнения целей',
        width: '50%',
        height: 'auto',
        dialogClass: "wt-lp-dialog",
        buttons: [{
            text: 'Отмена',
            class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
            click: () => {
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }, {
            text: 'Сохранить',
            class: 'wt-lp-dialog-btn wt-lp-dialog-ok',
            click: () => {
                saveGoalmap({
                    id: goalmap.id,
                    finish_goals_mark: $('#final_mark_result option:selected').attr('goal_result_id'),
                    comment_coll: $('#ui_dialog').find('#final_comment_coll').val(),
                    comment_manager: $('#ui_dialog').find('#final_comment_manager').val()
                });
                $('#ui_dialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        }],
        close: () => {
            $('#ui_dialog').remove();
            $('#dialog_background_overlay').css('display', 'none');
        }
    });

    sendRequest({ mode: 'goal_results' }, (goal_results) => {
        tabSelects = $('#dialog_tabs').find('select');

        tabSelects.append(`<option></option>`)
        goal_results.forEach(goal_result => {
            if (goal_result.final_result_ignore != true) {
                tabSelects.each((index, tabSelect) => {
                    optionIsSelected = goalmap[`finish_goals_mark`] == goal_result.id;
                    option = $(tabSelect).append(`<option goal_result_id="${goal_result.id}" ${optionIsSelected ? 'selected' : ''}>${goal_result.name}</option>`)
                })
            }
        });
    });

    select_elems = $('#dialog_tabs').find('select');
    select_elems.each((index, select_elem) => {
        number = $(select_elem).attr('number');
        $(select_elem).selectmenu();
    });

    sendRequest({
        mode: 'goalmap_info',
        goalmap_id: $('#year_selector option:selected').attr('goalmap_id')
    }, (info) => {
        $('#dialog_tabs').append(`
            <div class="wt-lp-dialog-fld-container">
                <label>Комментарий сотрудника:</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='final_comment_coll' class="autoresize" oninput="autoResize(this)">${info.comment_coll}</textarea>
                </div>
            </div>
            <div class="wt-lp-dialog-fld-container">
                <label>Комментарий руководителя:</label>
                <div class="wt-lp-dialog-fld">
                    <textarea id='final_comment_manager' class="autoresize" oninput="autoResize(this)">${info.comment_manager}</textarea>
                </div>
            </div>
        `);

        is_owner = $('#year_selector option:selected').attr('is_owner');
        if (is_owner != 'true') {
            $('#ui_dialog').find('#final_comment_coll').attr('disabled', true);
        } else {
            $('#ui_dialog').find('#final_comment_manager').attr('disabled', true);
        }
    });

    jDialog = $('div.ui-dialog');
    jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
}

function confirmDialog(text, caption) {
    setTimeout(() => {
        $('#dialog_background_overlay').css('display', 'block');

        $(`
			<div id='ui_dialog_confirmDialog' class="wt-lp-dialog-body" style="margin: 1.5em .5em;">
				`+ text + `
			</div>
		`).dialog({
            resizable: false,
            draggable: false,
            title: caption,
            width: '50%',
            height: 'auto',
            dialogClass: "wt-lp-dialog",
            buttons: [{
                text: 'ОК',
                class: 'wt-lp-dialog-btn wt-lp-dialog-cancel',
                click: () => {
                    $('#ui_dialog_confirmDialog').remove();
                    $('#dialog_background_overlay').css('display', 'none');
                }
            }],
            close: () => {
                $('#ui_dialog_confirmDialog').remove();
                $('#dialog_background_overlay').css('display', 'none');
            }
        });
        jDialog = $('div.ui-dialog');
        jDialog.find('.ui-dialog-titlebar').addClass('wt-lp-dialog-title');
    }, 300)
}

function exportToPDF() {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', `goal_settings/goal_setting_col/goal_settting_col_controller.html?mode=pdf`, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function (e) {
        var blob = new Blob([this.response], { type: 'application/pdf' });
        var downloadUrl = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = downloadUrl;
        a.download = "goal_settting_col.pdf";
        a.click();
    };

    xhr.send(JSON.stringify({
        mode: 'pdf',
        html_code: createReportHtmlCode()
    }));
}

function getBlockForReportFromPage(selector) {
    target_html = $(selector)?.html();
    if (!target_html) {
        return "";
    }

    var temp_div = $('<div></div>');
    temp_div.html(target_html);
    temp_div.find('.goal-edit-button').remove();
    return temp_div.html();
}

function createReportHtmlCode() {
    year_selector_value = $('#year_selector').val();
    col_info_fullname_html = $('#col_info_fullname').html();
    col_info_position_html = $('#col_info_position').html();
    col_info_subdivision_html = $('#col_info_subdivision').html();
    col_info_department_html = $('#col_info_department').html();
    goalmap_info_state_name_html = $('#goalmap_info_state_name').html();
    goalmap_info_manager_fullname_html = $('#goalmap_info_manager_fullname').html();

    updateAllComments();

    col_info_comments_body_html = $('#col_info_comments_body').html();

    element = document.getElementById('col_info_comments_body');
    displayValue = window.getComputedStyle(element, null).getPropertyValue('display');
    if (displayValue === 'none') {
        str_attr = 'none';
    } else {
        str_attr = 'flex';
    }

    goals_html = getBlockForReportFromPage('#goals');


    okr_html = getBlockForReportFromPage('#okrs');

    iprs_html = getBlockForReportFromPage('#iprs');


    var styles_str;

    var xhr = new XMLHttpRequest();
    xhr.open('POST', `goal_settings/goal_setting_col/goal_settting_col_controller.html?mode=get_css_file`, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            styles_str = xhr.responseText;
        }
    };

    xhr.send(JSON.stringify({
        mode: 'get_css_file'
    }));

    styles_str = styles_str.replace(/\.ipr_comments_body\s*{[^}]+}/g, "");

    result =
        `<div class="viewport-header" style="padding: 1em 2em;">
        <div class="main-header">Цели и результаты сотрудника - ${year_selector_value}</div>
    </div>
    <div class="viewport-col-info">
        <div class="viewport-col-info-row">
            <div class="col-info-header-body">
                <div class="col-info-header">ФИО сотрудника:</div>
                ${col_info_fullname_html}
            </div>
            <div class="col-info-header-body">
                <div class="col-info-header">Должность:</div>
                ${col_info_position_html}
            </div>
            <div class="col-info-header-body">
                <div class="col-info-header">Подразделение:</div>
                ${col_info_subdivision_html}
            </div>
        </div>
        <div class="viewport-col-info-row">
            <div class="col-info-header-body">
                <div class="col-info-header">Департамент:</div>
                ${col_info_department_html}
            </div>
            <div class="col-info-header-body">
                <div class="col-info-header">Текущий статус:</div>
                ${goalmap_info_state_name_html}
            </div>
            <div class="col-info-header-body">
                <div class="col-info-header">Согласующий руководитель:</div>
                ${goalmap_info_manager_fullname_html}
            </div>
            <div class="col-info-header-body">
                <div class="col-info-header">Отображать цели с оценкой «не актульна»</div>
                <input type="checkbox" class="goalmap_checkbox" id="goalmap_irrelevant_check">
            </div>
        </div>
    </div>
     <div class="goals-body">
        <div class="viewport-goals-header">
            <div class="goals-main-header">Цели</div>
        </div>
        ${goals_html}
    </div>`+ (without_okrs ? "" : `
    <div class="goals-body">
        <div class="viewport-goals-header">
            <div class="goals-main-header">Вклад в OKR</div>
        </div>
        ${okr_html}
    </div>`) + `
    <div class="goals-body">
        <div class="viewport-goals-header">
            <div class="goals-main-header">Индивидуальный план развития</div>
        </div>
        ${iprs_html}
    </div>
    <div class="viewport-col-info">
        ${col_info_comments_body_html}
    </div>

    <style>
    ${styles_str}
    </style>
    <style>
        .viewport-header {
            border-bottom: 0;
            border-style: none none solid none;
            border-width: 0 0 2px 0;
            border-color: #EBEBEC;
        }


        .goals-body {
            page-break-after: always;
            border: none;
        }

        .goals-main-header {
            width: 100% !important;
        }

        .goal-plan-date {
            min-width: 8em;
            padding: 0em .5em 0.5em .5em !important;
        }

        .goal-plan-date-header {
            font-weight: bold;
        }

        .viewport-col-info {
            border: none;
        }

        .ipr_comments_body {
            overflow: visible !important;
            margin: 1em 0;
            display: ${str_attr} !important;
            flex-direction: column;
        }

        .ipr_sended_comment_body {
            margin-left: auto;
        }

        .ipr_comment_header {
            color: black;
        }

        .ipr_comment_message {
            display: inline-block;
            width: fit-content;
            text-align: end;
            color: black;
        }
    </style>`;
    return result;
}

function autoResize(elem) {
    elem.style.height = 'auto';
    elem.style.height = (elem.scrollHeight - 4) + 'px';
}
