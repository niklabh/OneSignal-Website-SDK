/**
 * Runs through every page of OneSignal's docs and tests each link to make sure they are valid.
 */
class ReadmeTester {

    /**
     * Checks for jQuery and the page being Readme.
     */
    static doPrerequisitesExist() {
        if (!window.jQuery) {
            warn('jQuery is not referenced and is required.');
        }
        if (location.hostname !== 'documentation.onesignal.com') {
            warn('Please run this script on https://documentation.onesignal.com.');
        }
        if (!window.fetch) {
            warn("Use a modern browser! The Fetch API doesn't exist on this browser.");
        }
    }

    static run() {
        if (!ReadmeTester.doPrerequisitesExist()) {
            warn('Exiting test because prerequisite check failed.');
            return;
        }
    }

    /**
     * Should we process a given link and its text? e.g. Do not process 'mailto:' links. And do not process empty
     * link texts.
     * @param link An href.
     * @param text An href's visible text.
     */
    static shouldProcessLinkAndText(link, text) {
        return text &&
               text !== '' &&
               link &&
               !Utils.contains(link, 'localhost') &&
               !Utils.contains(link, 'chrome://') &&
               !Utils.contains(link, 'yoursite.com') &&
               !Utils.contains(link, 'site.com') &&
               !Utils.contains(link, 'mailto:') &&
               !Utils.contains(link, 'example.com');
    }

    /**
     * Returns a hash of the document's title and links.
     * @param document A jQuery DOM object representing the fetched page.
     * @param link The absolute URL to load this document.
     */
    static parseDocumentDom(document, link) {
        let titleDom = jQuery('head > title');
        if (!titleDom) {
            warn('Title not found for document');
        }
        let title = titleDom.text();
        log(`Parsing document '${document}' at ${link}:`, 2);
        let linksDom = jQuery(document).find('#hub-content a');
        /*
         * A array of hashes of:
         * {
         *   link: 'https://doc-link.com',
         *   text: 'My Doc Link
         * }
         */
        let links = [];

        // Find all links on page
        linksDom.each((index, link) => {
            let href = jQuery(link).attr('href');
            let text = jQuery(link).text();

            if (ReadmeTester.shouldProcessLinkAndText(href, text)) {
                links.push({
                               link: href,
                               text: text
                           });
            }
        });
        return links;
    }

    /**
     * Returns invalid link errors for the specified document and link.
     * @param document A jQuery DOM object representing the fetched page.
     * @param link The absolute URL to load this document.
     */
    static getErrorForDocumentDom(document, link) {
        // Number of links that failed
        let errors = [];
        // List of links on page to evaluate in parallel
        let promises = [];

        let linksText = ReadmeTester.parseDocumentDom(document, link);
        for (let linkText of linksText) {
            let errorJob = ReadmeTester.getErrorForLink(linkText.link)
                                       .catch(error => {
                                           if (error) {
                                               errors.push(error);
                                           }
                                       });
            promises.push(errorJob);
        }
        return Promise.all(promises)
                      .then(() => {
                          return errors;
                      });
    }

    /**
     * @param link An absolute URL to the document.
     * @param text Sidebar text.
     */
    static getErrorForDocument(link, text) {
        return ReadmeTester.getErrorForLink(link)
                           .then(() => {
                               debug(`getErrorForDocument(${link}, ${text})`);
                               return fetch(link, {
                                   method: 'GET',
                                   cache: 'no-cache'
                               });
                           })
                           .then(response => response.text())
                           .then(text => {
                               let documentDom = jQuery(jQuery.parseHTML(text));
                               return ReadmeTester.getErrorForDocumentDom(documentDom, link);
                           })
                           .catch(error => {
                              log(`Sidebar menu '${text}' at ${link} failed to load: ${error}`);
                           });
    }

    /**
     * Returns a Promise that rejects to the fetch error if the link is invalid; otherwise returns a Promise that
     * resolves to null;
     * @param link An absolute URL.
     */
    static getErrorForLink(link) {
        let payload = {
            method: 'GET',
            headers: {},
            cache: 'no-cache'
        };
        var status;
        return fetch(link, payload)
            .then(response => {
                if (response.status >= 200 &&
                    response.status < 300) {
                    debug(`Successfully fetched link ${link}`);
                    return Promise.resolve(null);
                } else {
                    return Promise.reject(`Fetch completed with status code ${response.status}`);
                }
            })
            .catch(e => {
                return Promise.reject(`Fetch failed with error: ${e}`);
            });
    }
}

class Utils {
    static executeAndTimeoutPromiseAfter(promise, milliseconds, displayError) {
        let timeoutPromise = new Promise(resolve => setTimeout(() => resolve('promise-timed-out'), milliseconds));
        return Promise.race([promise, timeoutPromise]).then(value => {
            if (value === 'promise-timed-out') {
                log.warn(displayError || `Promise ${promise} timed out after ${milliseconds} ms.`);
                return Promise.reject(displayError || `Promise ${promise} timed out after ${milliseconds} ms.`);
            }
            else return value;
        });
    }

    /**
     * Returns true if match is in string; otherwise, returns false.
     */
    static contains(indexOfAble, match) {
        if (!indexOfAble)
            return false;
        return indexOfAble.indexOf(match) !== -1;
    }
}

function debug(text, indent) {
    let spaces = indent || 0;
    let textIndent = '';
    for (let i = 0; i < spaces * 4; i++) {
        textIndent += ' ';
    }
    console.log(`${textIndent}Readme Tester:`, text);
}

function log(text, indent) {
    let spaces = indent || 0;
    let textIndent = '';
    for (let i = 0; i < spaces * 4; i++) {
        textIndent += ' ';
    }
    console.log(`${textIndent}Readme Tester:`, text);
}

function warn(text) {
    console.warn('Readme Tester:', text);
}

window.ReadmeTester = ReadmeTester;

ReadmeTester.getErrorForDocument('https://documentation.onesignal.com/docs', 'Product Overview')
            .then(success => console.log('Success:', success))
            .catch(error => console.error('Error:', error));