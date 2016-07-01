import * as tld_tree from 'js/tld_tree.js';

function getBaseDomain(url) {
    try {
        return (url.match(/:\/\/(.[^/]+)/)[1]).replace('www.', '');
    } catch (ex) {
        return null;
    }
}

export function getTLDFromDomain(baseDomain) {
    var parts = baseDomain.split('.');

    var domains = tld_tree.tlds;
    var domain = null;
    while (parts.length > 0) {
        var p = parts.pop();
        domains = domains[p];
        if (domains) {
            if (domain == null) {
                domain = p;
            } else {
                domain = p + '.' + domain;
            }
        } else {
            domain = p + '.' + domain;
            break;
        }
    }

    return domain;
}

export function getTLD(url) {
    var host = getBaseDomain(url);
    if (!host) {
        return null;
    }

    return getTLDFromDomain(host);
}