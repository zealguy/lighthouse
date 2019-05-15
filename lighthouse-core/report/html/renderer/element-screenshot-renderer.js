/**
 * @license
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

/**
 * @fileoverview This file dislays a screenshot of the page with a particular element being
 * highlighted.
 */

/* globals self  */

// todo: import from rect helpers
/**
 * @param {LH.Artifacts.Rect} rect
 */
function getRectCenterPoint(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function containWithin(value, range) {
  if (value < range[0]) {
    value = range[0];
  }
  if (value > range[1]) {
    value = range[1];
  }
  return value;
}

function getScreenshotPositionDetails(highlightRect, displayAreaSize, screenshotSize) {
  const highlightCenter = getRectCenterPoint(highlightRect);

  // Try to center on highlighted area
  const screenshotLeftVisibleEdge = containWithin(
    highlightCenter.x - displayAreaSize.width / 2,
    [0, screenshotSize.width - displayAreaSize.width]
  );
  const screenshotTopVisisbleEdge = containWithin(
    highlightCenter.y - displayAreaSize.height / 2,
    [0, screenshotSize.height - displayAreaSize.height]
  );

  return {
    screenshotPositionInDisplayArea: {
      left: screenshotLeftVisibleEdge,
      top: screenshotTopVisisbleEdge,
    },
    highlightPositionInDisplayArea: {
      left: highlightRect.left - screenshotLeftVisibleEdge,
      top: highlightRect.top - screenshotTopVisisbleEdge,
    },
  };
}

class ElementScreenshotRenderer {
  static renderClipPath(dom, clipId, {top, bottom, left, right}) {
    const clipPathSvg = dom.createElement('div');
    clipPathSvg.innerHTML = `<svg height="0" width="0">
        <defs>
          <clipPath id='${clipId}' clipPathUnits='objectBoundingBox'>
            <polygon points="0,0  1,0  1,${top} 0,${top}" ></polygon>
            <polygon points="0,${bottom} 1,${bottom} 1,1 0,1" ></polygon>
            <polygon points="0,${top} ${left},${top} ${left},${bottom} 0,${bottom}" ></polygon>
            <polygon points="${right},${top} 1,${top} 1,${bottom} ${right},${bottom}" ></polygon>
          </clipPath>
        </defs>
      </svg>`;
    return clipPathSvg;
  }

  /**
   * @param {DOM} dom
   * @param {ParentNode} templateContext
   * @param {LH.Audit.Details.NodeValue} item
   * @return {Element}
   */
  static render(dom, templateContext, item, fullPageScreenshotAuditResult) {
    const fullpageScreenshotUrl = fullPageScreenshotAuditResult.details.data;

    const tmpl = dom.cloneTemplate('#tmpl-lh-element-screenshot', templateContext);
    const previewContainer = dom.find('.lh-element-screenshot', tmpl);

    const displayAreaSize = {
      width: 412,
      height: 300,
    };
    const boundingRect = /** @type {LH.Artifacts.Rect} */ (item.boundingRect);

    const positionDetails = getScreenshotPositionDetails(
      boundingRect,
       displayAreaSize,
       fullPageScreenshotAuditResult.details
    );

    const image = /** @type {HTMLElement} */
      (previewContainer.querySelector('.lh-element-screenshot__image'));
    image.style.width = displayAreaSize.width + 'px';
    image.style.height = displayAreaSize.height + 'px';
    image.style.backgroundImage = 'url(' + fullpageScreenshotUrl + ')';
    image.style.backgroundPositionY = -(positionDetails.screenshotPositionInDisplayArea.top) + 'px';
    image.style.backgroundPositionX = -(positionDetails.screenshotPositionInDisplayArea.left) + 'px';

    const elMarker = /** @type {HTMLElement} */
      (previewContainer.querySelector('.lh-element-screenshot__element-marker'));
    elMarker.style.width = boundingRect.width + 'px';
    elMarker.style.height = boundingRect.height + 'px';
    elMarker.style.left = positionDetails.highlightPositionInDisplayArea.left + 'px';
    elMarker.style.top = positionDetails.highlightPositionInDisplayArea.top + 'px';

    const mask = /** @type {HTMLElement} */
      (previewContainer.querySelector('.lh-element-screenshot__mask'));
    const clipId = 'clip-' + Math.floor(Math.random() * 100000000);
    mask.style.width = displayAreaSize.width + 'px';
    mask.style.height = displayAreaSize.height + 'px';
    mask.style.clipPath = 'url(#' + clipId + ')';

    const top = positionDetails.highlightPositionInDisplayArea.top / displayAreaSize.height;
    const bottom = top + boundingRect.height / displayAreaSize.height;
    const left = positionDetails.highlightPositionInDisplayArea.left / displayAreaSize.width;
    const right = left + boundingRect.width / displayAreaSize.width;
    mask.appendChild(
      ElementScreenshotRenderer.renderClipPath(dom, clipId, {top, bottom, left, right})
    );

    return previewContainer;
  }
}

ElementScreenshotRenderer.getScreenshotPositionDetails = getScreenshotPositionDetails;

// Allow Node require()'ing.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ElementScreenshotRenderer;
} else {
  self.ElementScreenshotRenderer = ElementScreenshotRenderer;
}