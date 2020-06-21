
import axios      from 'axios';

import {browser}  from 'browser';
import * as msg   from 'message';

/**
 * Listen runtime message, include: `axios`
 */
browser.runtime.onMessage.addListener( function( request, sender, sendResponse ) {
    if ( request.type == msg.MESSAGE_ACTION.AXIOS ) {
        if ( request.value.type == "post" ) {
            if ( request.value.form ) {
                request.value.data = new FormData();
                Object.keys( request.value.form ).forEach( key => request.value.data.append( key, request.value.form[key] ) );
            }
            axios.post( request.value.url, request.value.data )
                .then( response => sendResponse({ done: response }))
                .catch( error   => sendResponse({ fail: error    }));
        } else if ( request.value.type == 'put' ) {
            axios.put( request.value.url, request.value.content, request.value.data )
                .then( response => sendResponse({ done: response }))
                .catch( error   => sendResponse({ fail: error    }));
        }else if( request.value.type == 'download' ) {
            axios(request.value)
            .then( response => sendResponse({ done: response }))
            .catch( error   => sendResponse({ fail: error    }));
        }
    }
    return true;
});

/**
 * Listen runtime message, include: `notion`
 */
;(function () {
    const DownLoadCache = new Map();

  browser.runtime.onMessage.addListener(async function (
    request,
    sender,
    sendResponse
  ) {
    if (request.type == msg.MESSAGE_ACTION.NOTION_DL_IMG) {
      try {
        const option = request.value
        const { url, protocol } = option
        const dlRes = await axios({
          method: 'get',
          url: url.replace(/https?:/, protocol),
          responseType: 'blob',
        })

        let blob = dlRes.data

        if (blob.type === 'image/webp') {
          blob = blob.slice(0, blob.size, 'image/jpeg')
        }
        DownLoadCache.set(url, blob)
        sendResponse({
          done: {
            type: blob.type,
            size: blob.size,
            url,
          },
        })
      } catch (err) {
        sendResponse({ fail: err })
      }
    } else if (request.type == msg.MESSAGE_ACTION.NOTION_UP_IMG) {
      try {
        const option = request.value
        const { url, upUrl } = option

        const blob = DownLoadCache.get(url)

        await axios.put(upUrl, blob, {
          headers: {
            'Content-Type': blob.type,
          },
        })

        DownLoadCache.delete(url)
        sendResponse({ done: true })
      } catch (err) {
        sendResponse({ fail: err })
      }
    }
    return true
  })
})()
