/**
 * Copyright (c) 2020 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import * as React from 'react';

export function Icon(props: {
    svg?: React.FC,
    // name?: IconName | undefined,
    style?: React.CSSProperties,
    title?: string,
    /** Adds right margin to the icon */
    inline?: boolean
}) {
    if (!props.svg) return null;
    return <span className={`msp-icon msp-material-icon${props.inline ? ' msp-icon-inline' : ''}`} title={props.title} style={props.style}><props.svg /></span>;
}

//

export function Union() { return _union; }
export function Subtract() { return _subtract; }
export function Intersect() { return _intersect; }
export function SetSvg() { return _set; }
export function MoleculeSvg() { return _molecule; }
export function RulerSvg() { return _ruler; }
export function CubeSvg() { return _cube; }

const circleLeft = <circle r="6px" id="circle-left" cy="12px" cx="8px" strokeWidth="1" />;
const circleRight = <circle r="6px" id="circle-right" cy="12px" cx="16px" strokeWidth="1" />;

const _union = <svg width="24px" height="24px" viewBox="0 0 24 24">
    <defs>
        {circleLeft}
        {circleRight}
    </defs>
    <g>
        <use href="#circle-left" className="msp-shape-filled" />
        <use href="#circle-right" className="msp-shape-filled" />
        <use href="#circle-left" className="msp-shape-empty" />
    </g>
</svg>;

const _subtract = <svg width="24px" height="24px" viewBox="0 0 24 24">
    <defs>
        {circleLeft}
        {circleRight}
        <mask id="mask-left">
            <use href="#circle-left" fill="white" stroke="white" />
            <use href="#circle-right" fill="black" strokeWidth="0" stroke="white" />
        </mask>
    </defs>
    <g>
        <use href="#circle-left" className="msp-shape-filled" mask="url(#mask-left)" />
        <use href="#circle-right" className="msp-shape-empty" />
    </g>
</svg>;

const _intersect = <svg width="24px" height="24px" viewBox="0 0 24 24">
    <defs>
        {circleLeft}
        {circleRight}
        <clipPath id="clip-left">
            <use href="#circle-right" />
        </clipPath>
    </defs>
    <g>
        <use href="#circle-left" className="msp-shape-filled" clipPath="url(#clip-left)" />
        <use href="#circle-left" className="msp-shape-empty" />
        <use href="#circle-right" className="msp-shape-empty" />
    </g>
</svg>;

const _set = <svg width="24px" height="24px" viewBox="0 0 24 24">
    <defs>
        {circleLeft}
        {circleRight}
    </defs>
    <g>
        <use href="#circle-left" className="msp-shape-empty" />
        <use href="#circle-right" className="msp-shape-filled" />
    </g>
</svg>;

const _molecule = <svg width="17px" height="17px" viewBox="0 0 299.463 299.463">
    <g>
        <path d="M256.851,173.832v-48.201c22.916-4.918,34.151-30.668,22.556-50.771c-11.547-20.004-39.486-23.251-55.242-5.844
			l-41.746-24.106C189.618,22.603,172.861,0,149.734,0c-23.132,0-39.881,22.609-32.685,44.911L75.305,69.016
			C59.522,51.586,31.597,54.88,20.061,74.863c-11.63,20.163-0.298,45.862,22.557,50.769v48.2
			c-22.821,4.898-34.195,30.591-22.556,50.771c11.529,19.972,39.454,23.285,55.242,5.845l41.746,24.106
			c-7.199,22.308,9.559,44.911,32.685,44.911c23.132,0,39.88-22.609,32.685-44.911l41.745-24.106
			c15.817,17.469,43.73,14.099,55.242-5.844c0,0,0-0.001,0.001-0.002c4.587-7.953,5.805-17.213,3.431-26.076
			C279.392,185.657,269.129,176.461,256.851,173.832z M249.62,72.088c20.568,0,27.428,27.191,10.008,37.239
			c-0.003,0.002-0.006,0.003-0.009,0.005c-10.04,5.81-22.85,1.762-27.877-8.475C225.206,87.548,234.938,72.088,249.62,72.088z
			 M149.734,14.4c11.005,0,19.958,8.954,19.958,19.959c0,11.127-9.077,19.958-19.958,19.958c-10.95,0-19.958-8.9-19.958-19.958
			C129.776,23.354,138.729,14.4,149.734,14.4z M39.84,109.328c-17.451-10.067-10.534-37.24,10.01-37.24
			c15.311,0,24.922,16.653,17.251,29.942C61.681,111.397,49.517,114.925,39.84,109.328z M59.802,224.702
			c-9.535,5.503-21.768,2.229-27.268-7.298c-7.639-13.242,1.887-29.945,17.236-29.945c0.013,0,0.027,0,0.04,0
			C70.07,187.48,77.49,214.469,59.802,224.702z M149.734,285.062c-11.005,0-19.958-8.954-19.958-19.958
			c0-11.127,9.077-19.958,19.958-19.958c10.954,0,19.958,8.903,19.958,19.958C169.693,276.109,160.74,285.062,149.734,285.062z
			 M216.953,217.982l-41.727,24.095c-13.778-15.22-37.459-14.94-50.983,0l-41.728-24.096c6.196-19.289-5.541-39.835-25.498-44.149
			V125.63c19.752-4.268,31.762-24.65,25.498-44.149l41.727-24.095c13.629,15.055,37.32,15.093,50.983,0l41.728,24.096
			c-6.196,19.29,5.534,39.835,25.498,44.149v48.202C222.61,178.123,210.721,198.581,216.953,217.982z M266.935,217.404
			c-5.501,9.528-17.732,12.802-27.261,7.302c-17.682-10.23-10.301-37.247,10.032-37.247
			C264.984,187.459,274.602,204.112,266.935,217.404z"/>
    </g>
</svg>;

const _ruler = <svg viewBox="0 0 508.073 508.073" width="17px" height="17px">
    <g>
        <path d="M470.459,378.925c-0.7-2.1-1.9-4-3.4-5.5l-113.9-113.9l149.8-149.8c10-10,2.6-17.3,0-19.9l-85.7-85.7
			c-5.5-5.5-14.4-5.5-19.9,0l-149.8,149.8l-134.7-134.7c-25.5-25.5-67.8-25.6-93.4,0c-25.8,25.8-25.8,67.7,0,93.5l134.6,134.7
			l-149.9,149.9c-5.5,5.5-5.5,14.4,0,19.9l85.6,85.7c2.6,2.6,10,10,19.9,0l150-149.9l113.9,113.9c1.5,1.5,3.4,2.7,5.5,3.4
			l110.4,36.9c6,2,10.7,0.3,14.4-3.4c3.8-3.8,5.1-9.4,3.4-14.4L470.459,378.925z M276.159,165.225l29.9,29.9
			c5.5,5.5,14.4,5.5,19.9,0c5-5,5.5-14.4,0-19.9l-29.9-29.9l23.7-23.7l13,13c5.5,5.5,14.4,5.5,19.9,0c5.2-5.2,6.2-13.7,0-19.9
			l-13-13l23.7-23.7l29.4,29.4c5.5,5.5,14.4,5.5,19.9,0c5.6-5.6,5.5-14.4,0-19.9l-29.4-29.5l24-24l65.8,65.7l-139.8,139.9
			l-65.8-65.8L276.159,165.225z M39.359,92.825c-14.8-14.8-14.8-38.8,0-53.6c14.1-14.1,38.8-14.7,53.6,0l15.5,15.5l-53.6,53.6
			L39.359,92.825z M99.759,473.025l-65.7-65.7l24-24l13.2,13.2c5.5,5.5,14.4,5.6,19.9,0c5.5-5.5,5.5-14.4,0-19.9l-13.1-13.3
			l23.7-23.7l29.6,29.6c6.2,6.2,14.7,5.2,19.9,0c5.5-5.5,5.5-14.4,0-19.9l-29.6-29.6l23.7-23.7l13.2,13.2c5.5,5.5,14.9,5,19.9,0
			c5.5-5.5,5.5-14.4,0-19.9l-13.2-13.2l8.8-8.8l65.8,65.7L99.759,473.025z M74.759,128.225l53.6-53.6l308.7,308.7l-53.6,53.6
			L74.759,128.225z M409.659,450.725l41.3-41.3l20.7,61.9L409.659,450.725z"/>
    </g>
</svg>;

const _cube = <svg viewBox="0 0 270.06 270.06" width="17px" height="17px">
    <g>
        <path d="M264.898,0.007
c-0.181,0.006-0.362,0.023-0.541,0.049H84.996c-1.326,0-2.598,0.527-3.535,1.465l-80,80C0.525,82.459-0.001,83.73,0,85.056v180
c0,2.761,2.239,5,5,5h180c1.326,0,2.598-0.527,3.535-1.465l80-80c0.938-0.938,1.465-2.209,1.465-3.535V5.819
c0.14-0.893,0.035-1.807-0.303-2.645c-0.016-0.045-0.033-0.09-0.051-0.135c-0.808-1.89-2.69-3.093-4.744-3.033L264.898,0.007z
M87.066,10.056h165.859l-70,70H17.066L87.066,10.056z M259.996,17.126v165.859l-70,70V87.126L259.996,17.126L259.996,17.126z
M84.92,19.985c-2.759,0.042-4.963,2.311-4.924,5.07v40c-0.039,2.761,2.168,5.032,4.929,5.071s5.032-2.168,5.071-4.929
c0.001-0.047,0.001-0.094,0-0.141v-40c0.039-2.761-2.168-5.031-4.93-5.07C85.018,19.984,84.969,19.984,84.92,19.985z M9.996,90.056
h170v170h-170V90.056L9.996,90.056z M84.92,99.985c-2.759,0.042-4.963,2.311-4.924,5.07v30c-0.039,2.761,2.168,5.032,4.929,5.071
s5.032-2.168,5.071-4.929c0.001-0.047,0.001-0.094,0-0.141v-30c0.039-2.761-2.168-5.031-4.93-5.07
C85.018,99.984,84.969,99.984,84.92,99.985z M84.92,159.985c-2.759,0.042-4.963,2.311-4.924,5.07v17.93L61.461,201.52
c-1.992,1.913-2.057,5.078-0.144,7.07c1.913,1.992,5.078,2.057,7.07,0.144c0.049-0.047,0.097-0.095,0.144-0.144l18.535-18.535h17.93
c2.761,0.039,5.032-2.168,5.071-4.929s-2.168-5.032-4.929-5.071c-0.047-0.001-0.094-0.001-0.141,0h-15v-15
c0.039-2.761-2.168-5.031-4.93-5.07C85.018,159.984,84.969,159.984,84.92,159.985z M134.996,180.055
c-2.761-0.039-5.032,2.168-5.071,4.929c-0.039,2.761,2.168,5.032,4.929,5.071c0.047,0.001,0.094,0.001,0.141,0h30
c2.761,0.039,5.032-2.168,5.071-4.929c0.039-2.761-2.168-5.032-4.929-5.071c-0.047-0.001-0.094-0.001-0.141,0H134.996z
M204.996,180.055c-2.761-0.039-5.032,2.168-5.071,4.929c-0.039,2.761,2.168,5.032,4.929,5.071c0.047,0.001,0.094,0.001,0.141,0h40
c2.761,0.039,5.032-2.168,5.071-4.929s-2.168-5.032-4.929-5.071c-0.047-0.001-0.094-0.001-0.141,0H204.996z M44.898,220.007
c-1.299,0.039-2.532,0.582-3.438,1.514l-20,20c-1.992,1.913-2.057,5.078-0.144,7.07c1.913,1.992,5.078,2.057,7.07,0.144
c0.049-0.047,0.097-0.095,0.144-0.144l20-20c1.98-1.925,2.025-5.091,0.1-7.071C47.654,220.514,46.3,219.965,44.898,220.007z"/>
    </g>
</svg>;