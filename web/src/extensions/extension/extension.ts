import { uniq } from 'lodash'
import * as GQL from '../../../../shared/src/graphql/schema'
import {
    EXTENSION_CATEGORIES,
    ExtensionCategory,
    ExtensionManifest,
} from '../../../../shared/src/schema/extension.schema'
import { Settings } from '../../../../shared/src/settings/settings'
import { ErrorLike, isErrorLike } from '../../../../shared/src/util/errors'

/** Pattern for valid extension names. */
export const EXTENSION_NAME_VALID_PATTERN = '^[a-zA-Z0-9](?:[a-zA-Z0-9]|[_.-](?=[a-zA-Z0-9]))*$'

/** Maximum allowed length for an extension name. */
export const EXTENSION_NAME_MAX_LENGTH = 128

/** A useful minimal type for a registry extension's publisher. */
export type RegistryPublisher = (
    | Pick<GQL.IUser, '__typename' | 'id' | 'username'>
    | Pick<GQL.IOrg, '__typename' | 'id' | 'name'>) & {
    /** The prefix for extension IDs published by this publisher (with the registry's host), if any. */
    extensionIDPrefix?: string
}

/** Returns the extension ID prefix (excluding the trailing "/") for a registry extension's publisher. */
export function extensionIDPrefix(p: RegistryPublisher): string {
    return `${p.extensionIDPrefix ? `${p.extensionIDPrefix}/` : ''}${publisherName(p)}`
}

export function publisherName(p: RegistryPublisher): string {
    switch (p.__typename) {
        case 'User':
            return p.username
        case 'Org':
            return p.name
    }
}

/** Returns the extension ID (in "publisher/name" format). */
export function toExtensionID(publisher: string | RegistryPublisher, name: string): string {
    return `${typeof publisher === 'string' ? publisher : extensionIDPrefix(publisher)}/${name}`
}

/** Reports whether the given extension is mentioned (enabled or disabled) in the settings. */
export function isExtensionAdded(settings: Settings | ErrorLike | null, extensionID: string): boolean {
    return !!settings && !isErrorLike(settings) && !!settings.extensions && extensionID in settings.extensions
}

/**
 * @param categories The (unvalidated) categories defined on the extension.
 * @returns An array that is the subset of {@link categories} consisting only of known categories, sorted and with
 * duplicates removed.
 */
export function validCategories(categories: ExtensionManifest['categories']): ExtensionCategory[] | undefined {
    if (!categories || categories.length === 0) {
        return undefined
    }
    const validCategories = uniq(
        categories.filter((c): c is ExtensionCategory => EXTENSION_CATEGORIES.includes(c as ExtensionCategory)).sort()
    )
    return validCategories.length === 0 ? undefined : validCategories
}
