const Joi = require("@hapi/joi");
const Scheme = require("../models/scheme")

const schemeValidation = Joi.object({
    niProvider: Joi.string().required(),
    schemeName: Joi.string().required(),
    implementedBy: Joi.string().regex(/^[^\d]+$/).required(),
    domainDescription: Joi.string().required(),
    eligibleDisabilities: Joi.string().required(),
    disabilityPercentage: Joi.string().required(),
    age: Joi.string().required(),
    annualIncome: Joi.string().required(),
    genderEligibility: Joi.string().regex(/^[^\d]+$/).required(),
    attachments: Joi.string().required(),
    comments: Joi.string().required(),
    emailAddress: Joi.string().email().regex(/^[^\s@]+@gmail\.com$/).required(),
});

const schemeEditValidation = Joi.object({
    niProvider: Joi.string(),
    schemeName: Joi.string(),
    implementedBy: Joi.string().regex(/^[^\d]+$/),
    domainDescription: Joi.string(),
    eligibleDisabilities: Joi.string(),
    disabilityPercentage: Joi.string(),
    age: Joi.string(),
    annualIncome: Joi.string(),
    genderEligibility: Joi.string().regex(/^[^\d]+$/),
    attachments: Joi.string(),
    comments: Joi.string(),
    emailAddress: Joi.string().email().regex(/^[^\s@]+@gmail\.com$/),
});

exports.schemeAdd = async (req, res) => {
    try {
        const {
            niProvider,
            schemeName,
            implementedBy,
            domainDescription,
            eligibleDisabilities,
            disabilityPercentage,
            age,
            annualIncome,
            genderEligibility,
            attachments,
            comments,
            emailAddress
        } = req.body;

        const { error } = schemeValidation.validate(req.body, { abortEarly: false });
        if (error) {
            const validationErrors = error.details.map(detail => detail.message);
            return res.status(400).send(validationErrors);
        }

        const newScheme = new Scheme({
            niProvider,
            schemeName,
            implementedBy,
            domainDescription,
            eligibleDisabilities,
            disabilityPercentage,
            age,
            annualIncome,
            genderEligibility,
            attachments,
            comments,
            emailAddress,
        });
        await newScheme.save();
        res.status(200).send("Scheme Data Added Successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
};

exports.schemeEdit = async (req, res) => {
    try {
        const { error } = schemeEditValidation.validate(req.body, { abortEarly: false });
        if (error) {
            const validationErrors = error.details.map(detail => detail.message);
            return res.status(400).send(validationErrors);
        }

        const schemeEditing = await Scheme.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!schemeEditing) {
            return res.status(404).send("No Data");
        }
        return res.status(200).send("Scheme details are Updated Successfully");
    } catch (err) {
        console.error(err);
        res.status(401).send(err);
    }
};

exports.schemeView = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const previousPage = req.query.previous === 'true';
    try {
        const updatedPage = previousPage ? Math.max(1, page - 1) : page;
        const parsedPage = parseInt(updatedPage);
        const parsedLimit = parseInt(limit);

        if (isNaN(parsedPage) || isNaN(parsedLimit) || parsedPage <= 0 || parsedLimit <= 0) {
            return res.status(400).send('Invalid pagination parameters');
        }

        const skip = (parsedPage - 1) * parsedLimit;
        const totalSchemes = await Scheme.countDocuments();
        const calculatedPageSize = totalSchemes < parsedLimit ? totalSchemes : parsedLimit;
        const totalPages = Math.ceil(totalSchemes / calculatedPageSize);

        const data = await Scheme
            .find()
            .sort({ _id: -1 })
            .skip(skip)
            .limit(calculatedPageSize);
        if (data && data.length > 0) {
            res.status(200).send({
                data,
                pageSize: calculatedPageSize,
                totalData: totalSchemes,
                currentPage: parsedPage,
                totalPages: totalPages
            });
        } else {
            res.status(400).send("No Scheme");
        }
    } catch (err) {
        res.status(500).send('Error: ' + err);
    }
};

exports.getSchemeById = async (req, res) => {
    try {
        const scheme = await Scheme.findById(req.params.id);
        if (!scheme) {
            return res.status(404).send('Scheme not found');
        }
        res.status(200).send(scheme);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


exports.schemeDelete = async (req, res) => {
    try {
        const schemeDeleting = await Scheme.findByIdAndDelete(req.params.id);
        if (!schemeDeleting) {
            return res.status(404).send("No Data");
        }
        return res.status(200).send("Scheme details are Deleted");
    } catch (error) {
        console.error(error);
        res.status(401).send(error);
    }
};

exports.getSchemesByKeyword = async (req, res) => {
    try {
        const keyword = req.params.keyword.toLowerCase();
        const schemes = await Scheme.find({
            $or: [
                { niProvider: { $regex: keyword, $options: 'i' } },
                { schemeName: { $regex: keyword, $options: 'i' } },
                { genderEligibility: { $regex: keyword, $options: 'i' } },
            ]
        }).sort({ _id: -1 });

        if (schemes && schemes.length > 0) {
            res.status(200).send(schemes);
        } else {
            res.status(404).send('No schemes found for the given keyword');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};