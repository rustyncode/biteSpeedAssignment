import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Contact } from '../models';

export const identify = async (req: Request, res: Response) => {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
        return res.status(400).json({ error: 'Email or phoneNumber is required' });
    }

    try {
        console.log(`Processing /identify for email: ${email}, phone: ${phoneNumber}`);

        // 1. Find matching contacts
        const matchingContacts = await Contact.findAll({
            where: {
                [Op.or]: [
                    email ? { email } : null,
                    phoneNumber ? { phoneNumber } : null
                ].filter(Boolean) as any[]
            }
        });

        if (matchingContacts.length === 0) {
            console.log('No matches. Creating new primary contact.');
            const newContact = await Contact.create({
                email: email || null,
                phoneNumber: phoneNumber || null,
                linkPrecedence: 'primary',
                linkedId: null
            });

            return res.status(200).json({
                contact: {
                    primaryContatctId: newContact.get('id'),
                    emails: [newContact.get('email')].filter(Boolean),
                    phoneNumbers: [newContact.get('phoneNumber')].filter(Boolean),
                    secondaryContactIds: []
                }
            });
        }

        console.log(`Found ${matchingContacts.length} matching contacts.`);

        // 2. Resolve the cluster's primary contacts
        let primaryContacts: Contact[] = [];
        const secondaries = matchingContacts.filter(c => c.get('linkPrecedence') === 'secondary');
        const directPrimaries = matchingContacts.filter(c => c.get('linkPrecedence') === 'primary');

        if (directPrimaries.length > 0) {
            primaryContacts = [...directPrimaries];
        }

        // Check if secondaries point to a primary not in matchingContacts
        const linkedPrimaryIds = [...new Set(secondaries.map(s => s.get('linkedId')))].filter(id => id !== null);
        for (const pid of linkedPrimaryIds) {
            if (!primaryContacts.find(p => p.get('id') === pid)) {
                const p = await Contact.findByPk(pid as number);
                if (p) primaryContacts.push(p);
            }
        }

        if (primaryContacts.length === 0) {
            console.error('CRITICAL: No primary contact found for cluster!');
            return res.status(500).json({ error: 'Database state inconsistency' });
        }

        // Sort by age
        primaryContacts.sort((a, b) => new Date(a.get('createdAt')).getTime() - new Date(b.get('createdAt')).getTime());
        const mainPrimary = primaryContacts[0]!;
        const mainPrimaryId = mainPrimary.get('id');

        console.log(`Primary contact for this cluster is ID: ${mainPrimaryId}`);

        // 3. Merging: If multiple primaries exist, demote others
        if (primaryContacts.length > 1) {
            console.log(`Merging ${primaryContacts.length - 1} other primaries into ID: ${mainPrimaryId}`);
            for (let i = 1; i < primaryContacts.length; i++) {
                const other = primaryContacts[i];
                const otherId = other.get('id');
                if (otherId === mainPrimaryId) continue;

                await other.update({
                    linkPrecedence: 'secondary',
                    linkedId: mainPrimaryId
                });

                // Also update any of its existing secondaries
                await Contact.update(
                    { linkedId: mainPrimaryId },
                    { where: { linkedId: otherId } }
                );
            }
        }

        // 4. Creation: Check if the current info is new to the cluster
        const currentEmailExists = matchingContacts.some(c => c.get('email') === email);
        const currentPhoneExists = matchingContacts.some(c => c.get('phoneNumber') === phoneNumber);

        if ((email && !currentEmailExists) || (phoneNumber && !currentPhoneExists)) {
            console.log('Adding new information as a secondary contact.');
            await Contact.create({
                email: email || null,
                phoneNumber: phoneNumber || null,
                linkPrecedence: 'secondary',
                linkedId: mainPrimaryId
            });
        }

        // 5. Final Response
        const finalNodes = await Contact.findAll({
            where: {
                [Op.or]: [
                    { id: mainPrimaryId },
                    { linkedId: mainPrimaryId }
                ]
            }
        });

        const allEmails = [...new Set(finalNodes.map(c => c.get('email')).filter(Boolean))];
        const allPhones = [...new Set(finalNodes.map(c => c.get('phoneNumber')).filter(Boolean))];
        const secondaryIds = finalNodes.filter(c => c.get('linkPrecedence') === 'secondary').map(c => c.get('id'));

        // Put primary info first
        const pEmail = mainPrimary.get('email');
        const pPhone = mainPrimary.get('phoneNumber');

        return res.status(200).json({
            contact: {
                primaryContatctId: mainPrimaryId,
                emails: [pEmail, ...allEmails.filter(e => e !== pEmail)].filter(Boolean),
                phoneNumbers: [pPhone, ...allPhones.filter(p => p !== pPhone)].filter(Boolean),
                secondaryContactIds: secondaryIds
            }
        });

    } catch (err) {
        console.error('Error in /identify:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
