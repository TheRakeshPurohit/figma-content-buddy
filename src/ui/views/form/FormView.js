import './FormView.css'
import Element from 'leo/element'
import SelectComponent from 'src/ui/components/select/SelectComponent'
import Tracking from 'src/utils/Tracking'
import AppState from 'src/AppState'

class FormView extends Element {

	bind() {
		// PLUGIN UI CONTROLS
		var empty = document.getElementById('empty')
		var content = document.getElementById('content')
		var check = document.getElementById('free_match_check')
		var free_match = document.getElementById('free_match')
		var unique_match = document.getElementById('unique_match')
		var query = document.getElementById('query')
		var uniques = document.getElementById('uniques')
		var match = document.getElementById('match')
		var replace = document.getElementById('replace')
		var apply = document.getElementById('apply')

		// Enable/disable free match
		check.addEventListener('change', e => {
			var enabled = check.checked
			if (enabled) {
				unique_match.classList.add('hidden')
				free_match.classList.remove('hidden')
			} else {
				unique_match.classList.remove('hidden')
				free_match.classList.add('hidden')
			}
		})

		// Search box
		query.addEventListener('keydown', e => {
			setTimeout(() => {
				var value = query.value.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				if (value != '') {
					uniques.querySelectorAll('.item').forEach(elem => {
						elem.classList.add('hidden')
						if (elem.getAttribute('key').search(value) != -1) elem.classList.remove('hidden')
					})
				} else {
					uniques.querySelectorAll('.item').forEach(elem => { elem.classList.remove('hidden') })
				}
			}, 25)
		})

		query.addEventListener('click', e => {
			Tracking.track('focusSearch')
		})

		// Click handlers for unique items
		uniques.addEventListener('click', e => {
			if (e.target.nodeName == 'LI') {
				if (e.target.classList.contains('selected')) {
					e.target.classList.remove('selected')
					apply.setAttribute('disabled', '')
					replace.value = ''
					parent.postMessage({ pluginMessage: { type: 'restoreSelection', options: {} } }, '*')
					Tracking.track('unselectContent')
				} else {
					var idx = parseInt(e.target.getAttribute('idx'))
					uniques.querySelectorAll('.selected').forEach(elem => elem.classList.remove('selected'))
					e.target.classList.add('selected')
					apply.removeAttribute('disabled')
					replace.value = e.target.querySelector('p').textContent
					parent.postMessage({ pluginMessage: { type: 'previewNodes', options: idx } }, '*')
					Tracking.track('selectContent')
				}
			}
		})

		// Apply replacements
		apply.addEventListener('click', e => {
			var free_match = check.checked
			if (free_match) {
				parent.postMessage({ pluginMessage: { type: 'freeMatch', options: { match: match.value, replace: replace.value } } }, '*')
			} else {
				if (replace.value !== '' || replace.value === '' && confirm('Replace with empty content?')) {
					parent.postMessage({ pluginMessage: { type: 'uniqueMatch', options: replace.value } }, '*')
					replace.value = ''
					Tracking.track('clickReplace')
				}
			}
		})

		AppState.on('empty', () => { this.displayEmptyState() })
		AppState.on('render', data => { this.renderUniques(data) })
		AppState.on('replaced', replacement => { this.replaceUnique(replacement) })
	}

	displayEmptyState() {
		var empty = document.getElementById('empty')
		var content = document.getElementById('content')
		content.classList.add('hidden')
		empty.classList.remove('hidden')
	}

	renderUniqueItem(item, idx) {
		var emptyClass = (item.key == ' ') ? 'empty': '';
		var text = (item.key == ' ') ? 'Empty layer': item.key;
		return `
		<li class="item ${emptyClass}" idx="${idx}" key="${item.key.toLowerCase()}">
			<div class="icon icon--recent icon--blue"></div>
			<p class="type type--11-pos" data-render="text">${text}</p>
		</li>
	`
	}

	renderUniques(data) {
		let uniques = document.getElementById('uniques')
		uniques.innerHTML = data.reduce((buffer, item, idx) =>  buffer += this.renderUniqueItem(item, idx),'')
	}

	replaceUnique(replacement) {
		let uniques = document.getElementById('uniques')
		let node = uniques.querySelector('.selected')
		node.setAttribute('key', replacement)
		node.querySelector('[data-render=text]').innerHTML = replacement
	}

	render() {
		return `
		 <form id="form">
			<section id="empty" class="empty-state hidden">
				<p class="type type--11-pos-bold">
					Empty selection
				</p>
				<p class="type type--11-pos-medium">
					Select some text layers, groups or frames and run Content Buddy again.
				</p>
			</section>

			<section id="content">
				<fieldset class="hidden">
					<label class="switch">
						<div class="switch__container">
							<input id="free_match_check" type="checkbox" class="switch__checkbox">
							<span class="switch__slider"></span>
						</div>
						<div class="switch__label">Free match</div>
					</label>
				</fieldset>

				<fieldset id="unique_match">
					<p class="type type--11-pos-bold">Select your content</p>
					<label class="search">
						<div class="icon icon--search"></div>
						<input id="query" type="text" class="input" placeholder="Search content">
					</label>
					<ul class="list" id="uniques"></ul>
				</fieldset>

				<fieldset id="free_match" class="hidden">
					<p class="type type--11-pos-bold">Free match</p>
					<input id="match" type="text" class="input" placeholder="Match content">
				</fieldset>

				<section class="main-actions">
					<p class="type type--11-pos-bold">Replacement mode</p>
					<c-select id="replace_mode">
						<option selected>Simple replace</option>
						<option>AI replace</option>
					</c-select>

					<fieldset id="default_replace">
						<p class="type type--11-pos-bold">Replace to</p>
						<input id="replace" type="text" class="input" placeholder="New content">
					</fieldset>

					<fieldset id="ai_replace">
						<p class="type type--11-pos">Replace your content using one of the available prompts:</p>
						<c-select id="ai_replace_prompt">
							<option selected>Fix typos</option>
							<option>Translate</option>
							<option>Make it shorter</option>
							<option>Make it longer</option>
							<option>Iterate</option>
						</c-select>
						<section>
							<p class="type type--11-pos-bold">OpenAI Token</p>
							<p class="type type--11-pos">Tokens are stored locally. <a target="_blank" href="https://help.openai.com/en/articles/6614209-how-do-i-check-my-token-usage">How to obtain a token?</a></p>
							<input id="openai_token" type="text" class="input" placeholder="Your API token">
						</section>
					</fieldset>

					<button type="button" id="apply" class="button button--primary" disabled>Replace</button>
				</section>
			</section>
		</form>
		`
	}
}

customElements.define('v-form', FormView)
