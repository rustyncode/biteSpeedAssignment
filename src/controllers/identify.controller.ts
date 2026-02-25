import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Contact } from '../models';

export const identify = async (req: Request, res: Response) => {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
        return res.status(400).json({ error: 'Email or phoneNumber is required' });
    }

    try {
        // 1. Find all contacts that match either email or phone
        const matchingContacts = await Contact.findAll({
            where: {
                [Op.or]: [
                    email ? { email } : null,
                    phoneNumber ? { phoneNumber } : null
                ].filter(Boolean) as any[]
            }
        });

        if (matchingContacts.length === 0) {
            // Create new primary contact
            const newContact = await Contact.create({
                email: email || null,
                phoneNumber: phoneNumber || null,
                linkPrecedence: 'primary',
                linkedId: null
            });

            return res.status(200).json({
                contact: {
                    primaryContatctId: newContact.id,
                    emails: [newContact.email].filter(Boolean),
                    phoneNumbers: [newContact.phoneNumber].filter(Boolean),
                    secondaryContactIds: []
                }
            });
        }

        // 2. Identify the primary contact(s)
        let primaryContacts = matchingContacts.filter(c => c.linkPrecedence === 'primary');
        const secondaryContacts = matchingContacts.filter(c => c.linkPrecedence === 'secondary');

        // If we found only secondaries, we need to find their primaries
        if (primaryContacts.length === 0) {
            const primaryIds = [...new Set(secondaryContacts.map(c => c.linkedId))];
            primaryContacts = await Contact.findAll({ where: { id: primaryIds as number[] } });
        } else {
            // Collect all related primaries (e.g. if a secondary points to a primary not in matchingContacts)
            const linkedPrimaryIds = [...new Set(secondaryContacts.map(c => c.linkedId))].filter(id => !primaryContacts.find(p => p.id === id));
            if (linkedPrimaryIds.length > 0) {
                const extraPrimaries = await Contact.findAll({ where: { id: linkedPrimaryIds as number[] } });
                primaryContacts = [...primaryContacts, ...extraPrimaries];
            }
        }

        // Sort primaries by age (createdAt)
        primaryContacts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const mainPrimary = primaryContacts[0];

        // 3. Handle Merging: If multiple primaries exist, convert newer ones to secondary
        if (primaryContacts.length > 1) {
            for (let i = 1; i < primaryContacts.length; i++) {
                const otherPrimary = primaryContacts[i];
                await otherPrimary.update({
                    linkPrecedence: 'secondary',
                    linkedId: mainPrimary.id
                });
                // Also update any contacts previously linked to this primary
                await Contact.update(
                    { linkedId: mainPrimary.id },
                    { where: { linkedId: otherPrimary.id } }
                );
            }
        }

        // 4. Check if we need to create a NEW secondary contact
        const exactMatch = matchingContacts.some(
            c => (email ? c.email === email : true) && (phoneNumber ? c.phoneNumber === phoneNumber : true)
        );

        // If one of the details (email or phone) is provided but not present in the cluster, create secondary
        const emailExists = matchingContacts.some(c => c.email === email);
        const phoneExists = matchingContacts.some(c => c.phoneNumber === phoneNumber);

        if ((email && !emailExists) || (phoneNumber && !phoneExists)) {
            await Contact.create({
                email: email || null,
                phoneNumber: phoneNumber || null,
                linkPrecedence: 'secondary',
                linkedId: mainPrimary.id
            });
        }

        // 5. Build Response
        const allRelated = await Contact.findAll({
            where: {
                [Op.or]: [
                    { id: mainPrimary.id },
                    { linkedId: mainPrimary.id }
                ]
            }
        });

        const emails = [...new Set(allRelated.map(c => c.email).filter(Boolean))];
        const phoneNumbers = [...new Set(allRelated.map(c => c.phoneNumber).filter(Boolean))];
        const secondaryContactIds = allRelated.filter(c => c.linkPrecedence === 'secondary').map(c => c.id);

        // Ensure primary email/phone come first in the arrays (optional but cleaner)
        res.status(200).json({
            contact: {
                primaryContatctId: mainPrimary.id,
                emails: [mainPrimary.email, ...emails.filter(e => e !== mainPrimary.email)].filter(Boolean),
                phoneNumbers: [mainPrimary.phoneNumber, ...phoneNumbers.filter(p => p !== mainPrimary.phoneNumber)].filter(Boolean),
                secondaryContactIds
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
