/**
 * Copyright (c) 2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { DensityServer_Data_Database } from '../../mol-io/reader/cif/schema/density-server';
import { VolumeData } from '../../mol-model/volume/data';
import { Task } from '../../mol-task';
import { SpacegroupCell, Box3D } from '../../mol-math/geometry';
import { Tensor, Vec3 } from '../../mol-math/linear-algebra';

function volumeFromDensityServerData(source: DensityServer_Data_Database): Task<VolumeData> {
    return Task.create<VolumeData>('Create Volume Data', async ctx => {
        const { volume_data_3d_info: info, volume_data_3d: values } = source;
        const cell = SpacegroupCell.create(
            info.spacegroup_number.value(0),
            Vec3.ofArray(info.spacegroup_cell_size.value(0)),
            Vec3.scale(Vec3.zero(), Vec3.ofArray(info.spacegroup_cell_angles.value(0)), Math.PI / 180)
        );

        const axis_order_fast_to_slow = info.axis_order.value(0);

        const normalizeOrder = Tensor.convertToCanonicalAxisIndicesFastToSlow(axis_order_fast_to_slow);

        // sample count is in "axis order" and needs to be reordered
        const sample_count = normalizeOrder(info.sample_count.value(0));
        const tensorSpace = Tensor.Space(sample_count, Tensor.invertAxisOrder(axis_order_fast_to_slow), Float32Array);

        const data = Tensor.create(tensorSpace, Tensor.Data1(values.values.toArray({ array: Float32Array })));

        // origin and dimensions are in "axis order" and need to be reordered
        const origin = Vec3.ofArray(normalizeOrder(info.origin.value(0)));
        const dimensions = Vec3.ofArray(normalizeOrder(info.dimensions.value(0)));

        return {
            transform: { kind: 'spacegroup', cell, fractionalBox: Box3D.create(origin, Vec3.add(Vec3.zero(), origin, dimensions)) },
            data,
            dataStats: {
                min: info.min_sampled.value(0),
                max: info.max_sampled.value(0),
                mean: info.mean_sampled.value(0),
                sigma: info.sigma_sampled.value(0)
            }
        };
    });
}

export { volumeFromDensityServerData };