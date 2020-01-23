// ==UserScript==
// @name         Collapsable Duolingo Comments
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Enable comment collapsing in Duolingo comments
// @author       juan soldi
// @match        https://forum.duolingo.com/comment/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/jsoldi/Collapsable-Duolingo-Comments/master/src.js
// @downloadURL  https://raw.githubusercontent.com/jsoldi/Collapsable-Duolingo-Comments/master/src.js
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

	var setupDiv = function(div) {
		if (!div.collapsing) {
			div.collapsing = {};
			var author = div.querySelector('a[itemprop=author]');
			var link = document.createElement('a');
			author.classList.forEach(c => link.classList.add(c))
			link.innerText = '[-]';
			link.href = 'javascript:void(0)';		
			author.parentElement.insertBefore(link, author);

			Object.defineProperty(div.collapsing, 'margin', {
				get: function() {
					var nestedDiv = Array.from(div.children).find(e => e.matches('div:not([id=""])'));
					return parseInt(getComputedStyle(nestedDiv)['margin-left']);
				}
			});

			Object.defineProperty(div.collapsing, 'collapsed', {
				get: () => link.innerText === '[+++]',
				set: function(value) {
					if (div.collapsing.collapsed !== value) {

						if (window.paralelo)
							debugger;

						link.innerText = value ? '[+++]' : '[-]';
						div.querySelector('div[itemprop=text]').style.display = value ? 'none' : '';
						div.querySelector('div > span > div > ul').style.display = value ? 'none' : '';

						if (value) {
							for (var sibling = div.nextElementSibling; sibling; sibling = sibling.nextElementSibling) {
								if (div.collapsing.margin < sibling.collapsing.margin) 
									sibling.style.display = 'none';
								else
									break;
							}
						}
						else {
							var stack = [];
							stack.push(div);
							stack.peek = () => stack[stack.length - 1];

							for (var sibling = div.nextElementSibling; sibling; sibling = sibling.nextElementSibling) {
								var siblingMargin = sibling.collapsing.margin;

								if (siblingMargin <= div.collapsing.margin)
									break;

								while (siblingMargin <= stack.peek().collapsing.margin)
									stack.pop();

								sibling.style.display = stack.find(d => d.collapsing.collapsed) ? 'none' : '';
								stack.push(sibling);
							}
						}
					}
				}
			});

			link.addEventListener('click', () => div.collapsing.collapsed = !div.collapsing.collapsed);
		}
	};

	var setupAll = function() {
		document.querySelectorAll('div.uMmEI').forEach(div => setupDiv(div));
	};

	var interval = setInterval(function () { 
		if (document.querySelector('div.uMmEI')) {
			clearInterval(interval);

			var callback = function(mutationsList, observer) {
				if (Array.from(mutationsList).find(m => m.type === 'childList')) 
					setupAll();	
			};

			new MutationObserver(callback).observe(document.querySelector('div.uMmEI').parentElement, { childList: true });
			setupAll();
		}
	}, 250);
})();
