// See addonEnabled in background.js
let addonEnabled = true;

const template = document.querySelector('template#reload-rule');
const enabledElement = document.querySelector('.addon-enabled');
const disabledElement = document.querySelector('.addon-disabled');


// Fetch reload rules from storage.
getListRules().then(setReloadRules);


// Fetch Addon active from background.js.
chrome.runtime.sendMessage({type: 'requestAddonEnabled'});
chrome.runtime.onMessage.addListener((message) => {
    switch (message.type) {
        case 'addonEnabled':
            addonEnabled = message.addonEnabled;
            updatePopupUI();
            break;
    }
});


// Handle clicks on enabled/disabled state.
document.querySelectorAll('.toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
        addonEnabled = !addonEnabled;
        browser.storage.local.set({addonEnabled});
        chrome.runtime.sendMessage({type: 'addonEnabledChanged', addonEnabled});
        updatePopupUI();
    });
});


// Click handler.
document.body.addEventListener('click', (event) => {

    // Delete.
    const deleteTrigger = event.target.closest('.option-delete');
    if (deleteTrigger) {
        const container = event.target.closest('.split');
        container.classList.toggle('hidden');
        container.nextElementSibling.classList.toggle('hidden');
        event.stopPropagation();
        return;
    }

    // Confirm delete.
    const confirmDeleteTrigger = event.target.closest('.option-delete-confirm');
    if (confirmDeleteTrigger) {
        const id = confirmDeleteTrigger.getAttribute('data-rule-id');
        deleteRule(id).then((rules) => {
            const container = event.target.closest('.split');
            container.parentNode.removeChild(container.previousElementSibling);
            container.parentNode.removeChild(container);
            updateNoRules(rules);
        });
        event.stopPropagation();
        return;
    }

    // Cancel Delete.
    const cancelDeleteTrigger = event.target.closest('.option-delete-cancel');
    if (cancelDeleteTrigger) {
        const container = event.target.closest('.split');
        container.previousElementSibling.classList.toggle('hidden');
        container.classList.toggle('hidden');
        event.stopPropagation();
        return;
    }

    // Popup.
    const popAttr = event.target.closest('[data-pop]');
    if (popAttr) {
        window.open(browser.extension.getURL(popAttr.getAttribute('data-pop')),
            'live-reload',
            `width=400,height=600,
            left=${Math.max(20, screen.width - 420)},
            top=${event.screenY + 20}`
        );
        event.stopPropagation();
        return;
    }
});


function updatePopupUI() {
    enabledElement.classList.toggle('hidden', !addonEnabled);
    disabledElement.classList.toggle('hidden', addonEnabled);
}


function setReloadRules(rules) {
    updateNoRules(rules);
    rules.forEach((rule) => {
        const panel = template.content.querySelector('.panel-list-item.rule');
        const dataRuleEl = template.content.querySelector('[data-rule-id]');
        panel.querySelector('.text').textContent = rule.title;
        panel.setAttribute('data-pop', `form/form.html?rule=${rule.id}`);
        dataRuleEl.setAttribute('data-rule-id', rule.id);
        document.querySelector('#rules-list').appendChild(
            document.importNode(template.content, true)
        );
    });
}


function updateNoRules(rules) {
    const noRules = document.getElementById('no-rules');
    noRules.classList.toggle('hidden', rules.length >= 1);
}
