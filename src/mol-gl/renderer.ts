/**
 * Copyright (c) 2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import REGL = require('regl');
import * as glContext from './context'
import { PerspectiveCamera } from './camera/perspective'
import { PointRenderable, MeshRenderable, Renderable } from './renderable'
import Stats from './stats'

import { Vec3, Mat4 } from 'mol-math/linear-algebra'
import { ValueCell } from 'mol-util';
import { isNull } from 'util';
import OrbitControls from './controls/orbit';

let _renderObjectId = 0;
function getNextId() {
    return _renderObjectId++ % 0x7FFFFFFF;
}



export interface RenderUpdateInfo {

}

export type RenderData = { [k: string]: ValueCell<Helpers.TypedArray> }

export interface RenderObject {
    id: number
    type: 'mesh' | 'point'
    data: PointRenderable.Data | MeshRenderable.Data
    uniforms: { [k: string]: REGL.Uniform }
}

export function createRenderObject(type: 'mesh' | 'point', data: PointRenderable.Data | MeshRenderable.Data, uniforms: { [k: string]: REGL.Uniform }) {
    return { id: getNextId(), type, data, uniforms }
}

export function createRenderable(regl: REGL.Regl, o: RenderObject) {
    switch (o.type) {
        case 'mesh': return MeshRenderable.create(regl, o.data as MeshRenderable.Data, o.uniforms || {})
        case 'point': return PointRenderable.create(regl, o.data as PointRenderable.Data)
    }
}

interface Renderer {
    camera: PerspectiveCamera
    controls: any // OrbitControls

    add: (o: RenderObject) => void
    remove: (o: RenderObject) => void
    clear: () => void
    draw: () => void
    frame: () => void
}

function resizeCanvas (canvas: HTMLCanvasElement, element: HTMLElement) {
    let w = window.innerWidth
    let h = window.innerHeight
    if (element !== document.body) {
        let bounds = element.getBoundingClientRect()
        w = bounds.right - bounds.left
        h = bounds.bottom - bounds.top
    }
    canvas.width = window.devicePixelRatio * w
    canvas.height = window.devicePixelRatio * h
    Object.assign(canvas.style, { width: w + 'px', height: h + 'px' })
}

namespace Renderer {
    export function fromElement(element: HTMLElement, contexAttributes?: WebGLContextAttributes) {
        const canvas = document.createElement('canvas')
        Object.assign(canvas.style, { border: 0, margin: 0, padding: 0, top: 0, left: 0 })
        element.appendChild(canvas)

        if (element === document.body) {
            canvas.style.position = 'absolute'
            Object.assign(element.style, { margin: 0, padding: 0 })
        }

        function resize () {
            resizeCanvas(canvas, element)
        }

        window.addEventListener('resize', resize, false)

        // function onDestroy () {
        //     window.removeEventListener('resize', resize)
        //     element.removeChild(canvas)
        // }

        resize()

        return fromCanvas(canvas, contexAttributes)
    }

    export function fromCanvas(canvas: HTMLCanvasElement, contexAttributes?: WebGLContextAttributes) {
        function get (name: 'webgl' | 'experimental-webgl') {
            try {
                return canvas.getContext(name, contexAttributes)
            } catch (e) {
                return null
            }
        }
        const gl = get('webgl') || get('experimental-webgl')
        if (isNull(gl)) throw new Error('unable to create webgl context')
        return create(gl, canvas)
    }

    export function create(gl: WebGLRenderingContext, element: Element): Renderer {
        const renderableList: Renderable[] = []
        const objectIdRenderableMap: { [k: number]: Renderable } = {}

        const camera = PerspectiveCamera.create({
            near: 0.01,
            far: 1000,
            position: Vec3.create(0, 0, 50)
        })

        const controls = OrbitControls.create(element, {
            position: Vec3.create(0, 0, 50)
        })

        const extensions = [
            'OES_texture_float',
            'OES_texture_float_linear',
            'OES_element_index_uint',
            'EXT_blend_minmax',
            'ANGLE_instanced_arrays'
        ]
        if (gl.getExtension('EXT_disjoint_timer_query') !== null) {
            extensions.push('EXT_disjoint_timer_query')
        }

        const regl = glContext.create({ gl, extensions, profile: true })

        const baseContext = regl({
            context: {
                model: Mat4.identity(),
                transform: Mat4.identity(),
                view: camera.view,
                projection: camera.projection
            },
            uniforms: {
                model: regl.context('model' as any),
                transform: regl.context('transform' as any),
                view: regl.context('view' as any),
                projection: regl.context('projection' as any),
                'light.position': Vec3.create(0, 0, -100),
                'light.color': Vec3.create(1.0, 1.0, 1.0),
                'light.ambient': Vec3.create(0.5, 0.5, 0.5),
                'light.falloff': 0,
                'light.radius': 500
            }
        })

        const stats = Stats([])
        let prevTime = regl.now()

        const draw = () => {
            controls.update()
            controls.copyInto(camera.position, camera.direction, camera.up)
            camera.update()
            baseContext(state => {
                regl.clear({ color: [0, 0, 0, 1] })
                // TODO painters sort, filter visible, filter picking, visibility culling?
                renderableList.forEach(r => {
                    r.draw()
                })
                stats.update(state.time - prevTime)
                prevTime = state.time
            })
        }

        // TODO animate, draw, requestDraw
        return {
            camera,
            controls,

            add: (o: RenderObject) => {
                const renderable = createRenderable(regl, o)
                renderableList.push(renderable)
                objectIdRenderableMap[o.id] = renderable
                stats.add(renderable)
                draw()
            },
            remove: (o: RenderObject) => {
                if (o.id in objectIdRenderableMap) {
                    // TODO
                    // objectIdRenderableMap[o.id].destroy()
                    delete objectIdRenderableMap[o.id]
                    draw()
                }
            },
            clear: () => {
                for (const id in objectIdRenderableMap) {
                    // TODO
                    // objectIdRenderableMap[id].destroy()
                    delete objectIdRenderableMap[id]
                }
                renderableList.length = 0
                draw()
            },
            draw,
            frame: () => {
                regl.frame((ctx) => draw())
            }
        }
    }
}

export default Renderer