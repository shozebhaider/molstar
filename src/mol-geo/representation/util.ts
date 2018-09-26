/**
 * Copyright (c) 2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { defaults } from 'mol-util';
import { Structure } from 'mol-model/structure';
import { VisualQuality } from '../geometry/geometry';

export interface QualityProps {
    quality: VisualQuality
    detail: number
    radialSegments: number
    linearSegments: number
    resolution: number
}

export function getQualityProps(props: Partial<QualityProps>, structure?: Structure) {
    let quality = defaults(props.quality, 'auto' as VisualQuality)
    let detail = defaults(props.detail, 1)
    let radialSegments = defaults(props.radialSegments, 12)
    let linearSegments = defaults(props.linearSegments, 8)
    let resolution = defaults(props.resolution, 2)

    if (quality === 'auto' && structure) {
        let score = structure.elementCount
        if (structure.isCoarse) score *= 10
        if (score > 500_000) {
            quality = 'lowest'
        } else if (score > 300_000) {
            quality = 'lower'
        } else if (score > 100_000) {
            quality = 'low'
        } else if (score > 30_000) {
            quality = 'medium'
        } else if (score > 2_000) {
            quality = 'high'
        } else {
            quality = 'higher'
        }
    }

    switch (quality) {
        case 'highest':
            detail = 3
            radialSegments = 36
            linearSegments = 18
            resolution = 0.3
            break
        case 'higher':
            detail = 3
            radialSegments = 28
            linearSegments = 14
            resolution = 0.5
            break
        case 'high':
            detail = 2
            radialSegments = 20
            linearSegments = 10
            resolution = 1.0
            break
        case 'medium':
            detail = 1
            radialSegments = 12
            linearSegments = 8
            resolution = 2.0
            break
        case 'low':
            detail = 0
            radialSegments = 8
            linearSegments = 3
            resolution = 3
            break
        case 'lower':
            detail = 0
            radialSegments = 8
            linearSegments = 3
            resolution = 5
            break
        case 'lowest':
            detail = 0
            radialSegments = 4
            linearSegments = 2
            resolution = 8
            break
        case 'custom':
            // use defaults or given props as set above
            break
    }

    return {
        detail,
        radialSegments,
        linearSegments,
        resolution
    }
}