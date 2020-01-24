// ==UserScript==
// @name         Collapsable Duolingo Comments
// @namespace    https://github.com/jsoldi
// @version      0.7
// @description  Enable comment collapsing in Duolingo comments
// @author       juan soldi
// @match        https://forum.duolingo.com/*
// @grant        none
// @updateURL    https://github.com/jsoldi/Collapsable-Duolingo-Comments/raw/master/tamper.user.js
// @downloadURL  https://github.com/jsoldi/Collapsable-Duolingo-Comments/raw/master/tamper.user.js
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    var setupDiv = function(div) {
        if (!div.collapsing) {
            div.collapsing = {};
            var author = div.querySelector('a[itemprop=author]') || Array.from(div.querySelectorAll('div[class^=_]')).find(a => !a.children.length && /^\[.+\]$/.test(a.innerText));
            var link = document.createElement('a');
            author.classList.forEach(c => link.classList.add(c))
            link.innerText = '[-]';
            link.href = 'javascript:void(0)';
            author.parentElement.insertBefore(link, author);

            var updateElement = function(element, hidden) {
                if (element)
                    element.style.display = hidden ? 'none' : '';
            };

            Object.defineProperty(div.collapsing, 'margin', {
                get: function() {
                    var nestedDiv = Array.from(div.children).find(e => e.matches('div:not([id=""])'));
                    return parseInt(getComputedStyle(nestedDiv)['margin-left']);
                }
            });

            Object.defineProperty(div.collapsing, 'collapsed', {
                get: () => link.innerText === '[+]',
                set: function(value) {
                    if (div.collapsing.collapsed !== value) {
                        link.innerText = value ? '[+]' : '[-]';
                        updateElement(div.querySelector('div[itemprop=text]'), value);
                        updateElement(div.querySelector('div > span > div > ul'), value);
                        updateElement((div.querySelector('span > a[href^="https://www.duolingo.com/?purchasePlus"]') || {}).parentElement, value);

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
    
    var needsUpdate = true;
    new MutationObserver(() => needsUpdate = true).observe(document.documentElement, { childList: true, subtree: true });

    setInterval(function () {
        if (needsUpdate) {
            document.querySelectorAll('div.uMmEI').forEach(div => setupDiv(div));
            needsUpdate = false;
        }
    }, 500);
})();
