/**
 * Copyright (c) 2019-2020 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { CustomProperty } from '../../mol-model-props/common/custom-property';
import { QueryContext, Structure, StructureQuery, StructureSelection, StructureProperties, StructureElement } from '../../mol-model/structure';
import { BondType, NucleicBackboneAtoms, ProteinBackboneAtoms, SecondaryStructureType, AminoAcidNamesL, RnaBaseNames, DnaBaseNames, WaterNames, ElementSymbol } from '../../mol-model/structure/model/types';
import { PluginContext } from '../../mol-plugin/context';
import { MolScriptBuilder as MS } from '../../mol-script/language/builder';
import Expression from '../../mol-script/language/expression';
import { compile } from '../../mol-script/runtime/query/compiler';
import { StateBuilder } from '../../mol-state';
import { RuntimeContext } from '../../mol-task';
import { SetUtils } from '../../mol-util/set';
import { PluginStateObject } from '../objects';
import { StateTransforms } from '../transforms';
import { ElementNames } from '../../mol-model/structure/model/properties/atomic/types';

export enum StructureSelectionCategory {
    Type = 'Type',
    Structure = 'Structure Property',
    Atom = 'Atom Property',
    Bond = 'Bond Property',
    Residue = 'Residue Property',
    AminoAcid = 'Amino Acid',
    NucleicBase = 'Nucleic Base',
    Manipulate = 'Manipulate Selection',
    Validation = 'Validation',
    Misc = 'Miscellaneous',
    Internal = 'Internal',
}

export { StructureSelectionQuery };

interface StructureSelectionQuery {
    readonly label: string
    readonly expression: Expression
    readonly description: string
    readonly category: string
    readonly isHidden: boolean
    readonly priority: number
    readonly referencesCurrent: boolean
    readonly query: StructureQuery
    readonly ensureCustomProperties?: (ctx: CustomProperty.Context, structure: Structure) => Promise<void>
    getSelection(plugin: PluginContext, runtime: RuntimeContext, structure: Structure): Promise<StructureSelection>
}

interface StructureSelectionQueryProps {
    description?: string
    category?: string
    isHidden?: boolean
    priority?: number
    referencesCurrent?: boolean
    ensureCustomProperties?: (ctx: CustomProperty.Context, structure: Structure) => Promise<void>
}

function StructureSelectionQuery(label: string, expression: Expression, props: StructureSelectionQueryProps = {}): StructureSelectionQuery {
    let _query: StructureQuery;
    return {
        label,
        expression,
        description: props.description || '',
        category: props.category ?? StructureSelectionCategory.Misc,
        isHidden: !!props.isHidden,
        priority: props.priority || 0,
        referencesCurrent: !!props.referencesCurrent,
        get query() {
            if (!_query) _query = compile<StructureSelection>(expression);
            return _query;
        },
        ensureCustomProperties: props.ensureCustomProperties,
        async getSelection(plugin, runtime, structure) {
            const current = plugin.managers.structure.selection.getStructure(structure);
            const currentSelection = current ? StructureSelection.Singletons(structure, current) : StructureSelection.Empty(structure);
            if (props.ensureCustomProperties) {
                await props.ensureCustomProperties({ runtime, assetManager: plugin.managers.asset }, structure);
            }
            if (!_query) _query = compile<StructureSelection>(expression);
            return _query(new QueryContext(structure, { currentSelection }));
        }
    };
}

const all = StructureSelectionQuery('All', MS.struct.generator.all(), { category: '', priority: 1000 });
const current = StructureSelectionQuery('Current Selection', MS.internal.generator.current(), { category: '', referencesCurrent: true });

const polymer = StructureSelectionQuery('Polymer', MS.struct.modifier.union([
    MS.struct.generator.atomGroups({
        'entity-test': MS.core.logic.and([
            MS.core.rel.eq([MS.ammp('entityType'), 'polymer']),
            MS.core.str.match([
                MS.re('(polypeptide|cyclic-pseudo-peptide|nucleotide|peptide nucleic acid)', 'i'),
                MS.ammp('entitySubtype')
            ])
        ])
    })
]), { category: StructureSelectionCategory.Type });

const trace = StructureSelectionQuery('Trace', MS.struct.modifier.union([
    MS.struct.combinator.merge([
        MS.struct.modifier.union([
            MS.struct.generator.atomGroups({
                'entity-test': MS.core.rel.eq([MS.ammp('entityType'), 'polymer']),
                'chain-test': MS.core.set.has([
                    MS.set('sphere', 'gaussian'), MS.ammp('objectPrimitive')
                ])
            })
        ]),
        MS.struct.modifier.union([
            MS.struct.generator.atomGroups({
                'entity-test': MS.core.rel.eq([MS.ammp('entityType'), 'polymer']),
                'chain-test': MS.core.rel.eq([MS.ammp('objectPrimitive'), 'atomistic']),
                'atom-test': MS.core.set.has([MS.set('CA', 'P'), MS.ammp('label_atom_id')])
            })
        ])
    ])
]), { category: StructureSelectionCategory.Structure });

// TODO maybe pre-calculate atom properties like backbone/sidechain
const backbone = StructureSelectionQuery('Backbone', MS.struct.modifier.union([
    MS.struct.combinator.merge([
        MS.struct.modifier.union([
            MS.struct.generator.atomGroups({
                'entity-test': MS.core.logic.and([
                    MS.core.rel.eq([MS.ammp('entityType'), 'polymer']),
                    MS.core.str.match([
                        MS.re('(polypeptide|cyclic-pseudo-peptide)', 'i'),
                        MS.ammp('entitySubtype')
                    ])
                ]),
                'chain-test': MS.core.rel.eq([MS.ammp('objectPrimitive'), 'atomistic']),
                'atom-test': MS.core.set.has([MS.set(...SetUtils.toArray(ProteinBackboneAtoms)), MS.ammp('label_atom_id')])
            })
        ]),
        MS.struct.modifier.union([
            MS.struct.generator.atomGroups({
                'entity-test': MS.core.logic.and([
                    MS.core.rel.eq([MS.ammp('entityType'), 'polymer']),
                    MS.core.str.match([
                        MS.re('(nucleotide|peptide nucleic acid)', 'i'),
                        MS.ammp('entitySubtype')
                    ])
                ]),
                'chain-test': MS.core.rel.eq([MS.ammp('objectPrimitive'), 'atomistic']),
                'atom-test': MS.core.set.has([MS.set(...SetUtils.toArray(NucleicBackboneAtoms)), MS.ammp('label_atom_id')])
            })
        ])
    ])
]), { category: StructureSelectionCategory.Structure });

const protein = StructureSelectionQuery('Protein', MS.struct.modifier.union([
    MS.struct.generator.atomGroups({
        'entity-test': MS.core.logic.and([
            MS.core.rel.eq([MS.ammp('entityType'), 'polymer']),
            MS.core.str.match([
                MS.re('(polypeptide|cyclic-pseudo-peptide)', 'i'),
                MS.ammp('entitySubtype')
            ])
        ])
    })
]), { category: StructureSelectionCategory.Type });

const nucleic = StructureSelectionQuery('Nucleic', MS.struct.modifier.union([
    MS.struct.generator.atomGroups({
        'entity-test': MS.core.logic.and([
            MS.core.rel.eq([MS.ammp('entityType'), 'polymer']),
            MS.core.str.match([
                MS.re('(nucleotide|peptide nucleic acid)', 'i'),
                MS.ammp('entitySubtype')
            ])
        ])
    })
]), { category: StructureSelectionCategory.Type });

const helix = StructureSelectionQuery('Helix', MS.struct.modifier.union([
    MS.struct.generator.atomGroups({
        'entity-test': MS.core.logic.and([
            MS.core.rel.eq([MS.ammp('entityType'), 'polymer']),
            MS.core.str.match([
                MS.re('(polypeptide|cyclic-pseudo-peptide)', 'i'),
                MS.ammp('entitySubtype')
            ])
        ]),
        'residue-test': MS.core.flags.hasAny([
            MS.ammp('secondaryStructureFlags'),
            MS.core.type.bitflags([SecondaryStructureType.Flag.Helix])
        ])
    })
]), { category: StructureSelectionCategory.Structure });

const beta = StructureSelectionQuery('Beta Strand/Sheet', MS.struct.modifier.union([
    MS.struct.generator.atomGroups({
        'entity-test': MS.core.logic.and([
            MS.core.rel.eq([MS.ammp('entityType'), 'polymer']),
            MS.core.str.match([
                MS.re('(polypeptide|cyclic-pseudo-peptide)', 'i'),
                MS.ammp('entitySubtype')
            ])
        ]),
        'residue-test': MS.core.flags.hasAny([
            MS.ammp('secondaryStructureFlags'),
            MS.core.type.bitflags([SecondaryStructureType.Flag.Beta])
        ])
    })
]), { category: StructureSelectionCategory.Structure });

const water = StructureSelectionQuery('Water', MS.struct.modifier.union([
    MS.struct.generator.atomGroups({
        'entity-test': MS.core.rel.eq([MS.ammp('entityType'), 'water'])
    })
]), { category: StructureSelectionCategory.Type });

const branched = StructureSelectionQuery('Carbohydrate', MS.struct.modifier.union([
    MS.struct.generator.atomGroups({
        'entity-test': MS.core.logic.or([
            MS.core.rel.eq([MS.ammp('entityType'), 'branched']),
            MS.core.logic.and([
                MS.core.rel.eq([MS.ammp('entityType'), 'non-polymer']),
                MS.core.str.match([
                    MS.re('oligosaccharide', 'i'),
                    MS.ammp('entitySubtype')
                ])
            ])
        ])
    })
]), { category: StructureSelectionCategory.Type });

const branchedPlusConnected = StructureSelectionQuery('Carbohydrate with Connected', MS.struct.modifier.union([
    MS.struct.modifier.includeConnected({
        0: branched.expression, 'layer-count': 1, 'as-whole-residues': true
    })
]), { category: StructureSelectionCategory.Internal, isHidden: true });

const branchedConnectedOnly = StructureSelectionQuery('Connected to Carbohydrate', MS.struct.modifier.union([
    MS.struct.modifier.exceptBy({
        0: branchedPlusConnected.expression,
        by: branched.expression
    })
]), { category: StructureSelectionCategory.Internal, isHidden: true });

const ligand = StructureSelectionQuery('Ligand', MS.struct.modifier.union([
    MS.struct.combinator.merge([
        MS.struct.modifier.union([
            MS.struct.generator.atomGroups({
                'entity-test': MS.core.logic.and([
                    MS.core.rel.eq([MS.ammp('entityType'), 'non-polymer']),
                    MS.core.logic.not([MS.core.str.match([
                        MS.re('oligosaccharide', 'i'),
                        MS.ammp('entitySubtype')
                    ])])
                ]),
                'chain-test': MS.core.rel.eq([MS.ammp('objectPrimitive'), 'atomistic']),
                'residue-test': MS.core.logic.not([
                    MS.core.str.match([MS.re('saccharide', 'i'), MS.ammp('chemCompType')])
                ])
            })
        ]),
        // this is to get non-polymer and peptide terminus components in polymer entities,
        // - non-polymer, e.g. PXZ in 4HIV or generally ACE
        // - carboxy terminus, e.g. FC0 in 4BP9, or ETA in 6DDE
        // - amino terminus, e.g. ARF in 3K4V, or 4MM in 3EGV
        MS.struct.modifier.union([
            MS.struct.generator.atomGroups({
                'entity-test': MS.core.rel.eq([MS.ammp('entityType'), 'polymer']),
                'chain-test': MS.core.rel.eq([MS.ammp('objectPrimitive'), 'atomistic']),
                'residue-test': MS.core.str.match([
                    MS.re('non-polymer|(amino|carboxy) terminus|peptide-like', 'i'),
                    MS.ammp('chemCompType')
                ])
            })
        ])
    ]),
]), { category: StructureSelectionCategory.Type });

// don't include branched entities as they have their own link representation
const ligandPlusConnected = StructureSelectionQuery('Ligand with Connected', MS.struct.modifier.union([
    MS.struct.modifier.exceptBy({
        0: MS.struct.modifier.union([
            MS.struct.modifier.includeConnected({
                0: ligand.expression,
                'layer-count': 1,
                'as-whole-residues': true,
                'bond-test': MS.core.flags.hasAny([
                    MS.struct.bondProperty.flags(),
                    MS.core.type.bitflags([
                        BondType.Flag.Covalent | BondType.Flag.MetallicCoordination
                    ])
                ])
            })
        ]),
        by: branched.expression
    })
]), { category: StructureSelectionCategory.Internal, isHidden: true });

const ligandConnectedOnly = StructureSelectionQuery('Connected to Ligand', MS.struct.modifier.union([
    MS.struct.modifier.exceptBy({
        0: ligandPlusConnected.expression,
        by: ligand.expression
    })
]), { category: StructureSelectionCategory.Internal, isHidden: true });

// residues connected to ligands or branched entities
const connectedOnly = StructureSelectionQuery('Connected to Ligand or Carbohydrate', MS.struct.modifier.union([
    MS.struct.combinator.merge([
        branchedConnectedOnly.expression,
        ligandConnectedOnly.expression
    ]),
]), { category: StructureSelectionCategory.Internal, isHidden: true });

const disulfideBridges = StructureSelectionQuery('Disulfide Bridges', MS.struct.modifier.union([
    MS.struct.modifier.wholeResidues([
        MS.struct.modifier.union([
            MS.struct.generator.bondedAtomicPairs({
                0: MS.core.flags.hasAny([
                    MS.struct.bondProperty.flags(),
                    MS.core.type.bitflags([BondType.Flag.Disulfide])
                ])
            })
        ])
    ])
]), { category: StructureSelectionCategory.Bond });

const nonStandardPolymer = StructureSelectionQuery('Non-standard Residues in Polymers', MS.struct.modifier.union([
    MS.struct.generator.atomGroups({
        'entity-test': MS.core.rel.eq([MS.ammp('entityType'), 'polymer']),
        'chain-test': MS.core.rel.eq([MS.ammp('objectPrimitive'), 'atomistic']),
        'residue-test': MS.ammp('isNonStandard')
    })
]), { category: StructureSelectionCategory.Residue });

const coarse = StructureSelectionQuery('Coarse Elements', MS.struct.modifier.union([
    MS.struct.generator.atomGroups({
        'chain-test': MS.core.set.has([
            MS.set('sphere', 'gaussian'), MS.ammp('objectPrimitive')
        ])
    })
]), { category: StructureSelectionCategory.Type });

const ring = StructureSelectionQuery('Rings in Residues', MS.struct.modifier.union([
    MS.struct.generator.rings()
]), { category: StructureSelectionCategory.Residue });

const aromaticRing = StructureSelectionQuery('Aromatic Rings in Residues', MS.struct.modifier.union([
    MS.struct.generator.rings({ 'only-aromatic': true })
]), { category: StructureSelectionCategory.Residue });

const surroundings = StructureSelectionQuery('Surrounding Residues (5 \u212B) of Selection', MS.struct.modifier.union([
    MS.struct.modifier.exceptBy({
        0: MS.struct.modifier.includeSurroundings({
            0: MS.internal.generator.current(),
            radius: 5,
            'as-whole-residues': true
        }),
        by: MS.internal.generator.current()
    })
]), {
    description: 'Select residues within 5 \u212B of the current selection.',
    category: StructureSelectionCategory.Manipulate,
    referencesCurrent: true
});

const complement = StructureSelectionQuery('Inverse / Complement of Selection', MS.struct.modifier.union([
    MS.struct.modifier.exceptBy({
        0: MS.struct.generator.all(),
        by: MS.internal.generator.current()
    })
]), {
    description: 'Select everything not in the current selection.',
    category: StructureSelectionCategory.Manipulate,
    referencesCurrent: true
});

const bonded = StructureSelectionQuery('Residues Bonded to Selection', MS.struct.modifier.union([
    MS.struct.modifier.includeConnected({
        0: MS.internal.generator.current(), 'layer-count': 1, 'as-whole-residues': true
    })
]), {
    description: 'Select residues covalently bonded to current selection.',
    category: StructureSelectionCategory.Manipulate,
    referencesCurrent: true
});

const wholeResidues = StructureSelectionQuery('Whole Residues of Selection', MS.struct.modifier.union([
    MS.struct.modifier.wholeResidues({
        0: MS.internal.generator.current()
    })
]), {
    description: 'Expand current selection to whole residues.',
    category: StructureSelectionCategory.Manipulate,
    referencesCurrent: true
});

const StandardAminoAcids = [
    [['HIS'], 'HISTIDINE'],
    [['ARG'], 'ARGININE'],
    [['LYS'], 'LYSINE'],
    [['ILE'], 'ISOLEUCINE'],
    [['PHE'], 'PHENYLALANINE'],
    [['LEU'], 'LEUCINE'],
    [['TRP'], 'TRYPTOPHAN'],
    [['ALA'], 'ALANINE'],
    [['MET'], 'METHIONINE'],
    [['PRO'], 'PROLINE'],
    [['CYS'], 'CYSTEINE'],
    [['ASN'], 'ASPARAGINE'],
    [['VAL'], 'VALINE'],
    [['GLY'], 'GLYCINE'],
    [['SER'], 'SERINE'],
    [['GLN'], 'GLUTAMINE'],
    [['TYR'], 'TYROSINE'],
    [['ASP'], 'ASPARTIC ACID'],
    [['GLU'], 'GLUTAMIC ACID'],
    [['THR'], 'THREONINE'],
    [['SEC'], 'SELENOCYSTEINE'],
    [['PYL'], 'PYRROLYSINE'],
    [['UNK'], 'UNKNOWN'],
].sort((a, b) => a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0) as [string[], string][];

const StandardNucleicBases = [
    [['A', 'DA'], 'ADENOSINE'],
    [['C', 'DC'], 'CYTIDINE'],
    [['T', 'DT'], 'THYMIDINE'],
    [['G', 'DG'], 'GUANOSINE'],
    [['I', 'DI'], 'INOSINE'],
    [['U', 'DU'], 'URIDINE'],
    [['N', 'DN'], 'UNKNOWN'],
].sort((a, b) => a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0) as [string[], string][];

export function ResidueQuery([names, label]: [string[], string], category: string, priority = 0) {
    return StructureSelectionQuery(`${label} (${names.join(', ')})`, MS.struct.modifier.union([
        MS.struct.generator.atomGroups({
            'residue-test': MS.core.set.has([MS.set(...names), MS.ammp('auth_comp_id')])
        })
    ]), { category, priority, description: label });
}

export function ElementSymbolQuery([names, label]: [string[], string], category: string, priority: number) {
    return StructureSelectionQuery(`${label} (${names.join(', ')})`, MS.struct.modifier.union([
        MS.struct.generator.atomGroups({
            'atom-test': MS.core.set.has([MS.set(...names), MS.acp('elementSymbol')])
        })
    ]), { category, priority });
}

export function EntityDescriptionQuery([description, label]: [string[], string], category: string, priority: number) {
    return StructureSelectionQuery(`${label}`, MS.struct.modifier.union([
        MS.struct.generator.atomGroups({
            'entity-test': MS.core.list.equal([MS.list(...description), MS.ammp('entityDescription')])
        })
    ]), { category, priority, description: description.join(', ') });
}

const StandardResidues = SetUtils.unionMany(
    AminoAcidNamesL, RnaBaseNames, DnaBaseNames, WaterNames
);

export function getElementQueries(structures: Structure[]) {
    const uniqueElements = new Set<ElementSymbol>();
    for (const structure of structures) {
        structure.uniqueElementSymbols.forEach(e => uniqueElements.add(e));
    }

    const queries: StructureSelectionQuery[] = [];
    uniqueElements.forEach(e => {
        const label = ElementNames[e] || e;
        queries.push(ElementSymbolQuery([[e], label], 'Element Symbol', 0));
    });
    return queries;
}

export function getNonStandardResidueQueries(structures: Structure[]) {
    const residueLabels = new Map<string, string>();
    const uniqueResidues = new Set<string>();
    for (const structure of structures) {
        structure.uniqueResidueNames.forEach(r => uniqueResidues.add(r));
        for (const m of structure.models) {
            structure.uniqueResidueNames.forEach(r => {
                const comp = m.properties.chemicalComponentMap.get(r);
                if (comp) residueLabels.set(r, comp.name);
            });
        }
    }

    const queries: StructureSelectionQuery[] = [];
    SetUtils.difference(uniqueResidues, StandardResidues).forEach(r => {
        const label = residueLabels.get(r) || r;
        queries.push(ResidueQuery([[r], label], 'Ligand/Non-standard Residue', 200));
    });
    return queries;
}

export function getPolymerAndBranchedEntityQueries(structures: Structure[]) {
    const uniqueEntities = new Map<string, string[]>();
    const l = StructureElement.Location.create();
    for (const structure of structures) {
        l.structure = structure;
        for (const ug of structure.unitSymmetryGroups) {
            l.unit = ug.units[0];
            l.element = ug.elements[0];
            const entityType = StructureProperties.entity.type(l);
            if (entityType === 'polymer' || entityType === 'branched') {
                const description = StructureProperties.entity.pdbx_description(l);
                uniqueEntities.set(description.join(', '), description);
            }
        }
    }

    const queries: StructureSelectionQuery[] = [];
    uniqueEntities.forEach((v, k) => {
        queries.push(EntityDescriptionQuery([v, k], 'Polymer/Carbohydrate Entities', 300));
    });
    return queries;
}

export function applyBuiltInSelection(to: StateBuilder.To<PluginStateObject.Molecule.Structure>, query: keyof typeof StructureSelectionQueries, customTag?: string) {
    return to.apply(StateTransforms.Model.StructureSelectionFromExpression,
        { expression: StructureSelectionQueries[query].expression, label: StructureSelectionQueries[query].label },
        { tags: customTag ? [query, customTag] : [query] });
}

export const StructureSelectionQueries = {
    all,
    current,
    polymer,
    trace,
    backbone,
    protein,
    nucleic,
    helix,
    beta,
    water,
    branched,
    branchedPlusConnected,
    branchedConnectedOnly,
    ligand,
    ligandPlusConnected,
    ligandConnectedOnly,
    connectedOnly,
    disulfideBridges,
    nonStandardPolymer,
    coarse,
    ring,
    aromaticRing,
    surroundings,
    complement,
    bonded,
    wholeResidues,
};

export class StructureSelectionQueryRegistry {
    list: StructureSelectionQuery[] = []
    options: [StructureSelectionQuery, string, string][] = []
    version = 1

    add(q: StructureSelectionQuery) {
        this.list.push(q);
        this.options.push([q, q.label, q.category]);
        this.version += 1;
    }

    remove(q: StructureSelectionQuery) {
        const idx = this.list.indexOf(q);
        if (idx !== -1) {
            this.list.splice(idx, 1);
            this.options.splice(idx, 1);
            this.version += 1;
        }
    }

    constructor() {
        // add built-in
        this.list.push(
            ...Object.values(StructureSelectionQueries),
            ...StandardAminoAcids.map(v => ResidueQuery(v, StructureSelectionCategory.AminoAcid)),
            ...StandardNucleicBases.map(v => ResidueQuery(v, StructureSelectionCategory.NucleicBase))
        );
        this.options.push(...this.list.map(q => [q, q.label, q.category] as [StructureSelectionQuery, string, string]));
    }
}