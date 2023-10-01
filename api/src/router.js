const router = require('express').Router();
const { User, Token, Company, Event, EventDate } = require('./models');
const { log, get_or_create_token, get_user_by_token } = require('./utils');


router.get('/', (req, res) => {
    res.status(200).send({
        message: 'Application is running',
        error: false,
    });
})


// Authentication
router.post('/register', async (req, res) => {
    let date = new Date().toISOString();
    const ip = req.socket.remoteAddress;
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email: email });
        if (user) {
            return res.status(400).send({
                message: 'User already exists',
                error: true,
            });
        } else {
            user = await User.create({
                email: email,
                password: password,
                ip_address: ip,
                role: 'user',
                timestamp: date
            })
            await user.save();
            await log(`User created: ${email} from ${ip}`);
            return res.status(200).send({
                message: 'User created successfully',
                error: false
            })
        }
    } catch (error) {
        return res.status(500).send({
            message: error.message,
            error: true
        })
    }
})

router.post('/login', async (req, res) => {
    const ip = req.socket.remoteAddress;
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email: email });
        if (user) {
            if (user.password === password) {
                await log(`User logged in: ${email} from ${ip}`);
                let token = await get_or_create_token(user._id);
                return res.status(200).send({
                    message: 'User logged in successfully',
                    error: false,
                    token: token
                })
            } else {
                return res.status(400).send({
                    message: 'Incorrect password',
                    error: true
                })
            }
        } else {
            return res.status(400).send({
                message: 'User not found',
                error: true
            })
        }
    } catch (e) {
        return res.status(500).send({
            message: e.message,
            error: true
        })
    }
})

router.get('/profile', async (req, res) => {
    const ip = req.socket.remoteAddress;
    try {
        let user = await get_user_by_token(req.headers.authorization);
        if (user) {
            return res.status(200).send({
                message: 'User profile retrieved successfully',
                error: false,
                data: {
                    email: user.email,
                    token: req.headers.authorization
                }
            })
        } else {
            return res.status(400).send({
                message: 'User not found',
                error: true
            })
        }
    } catch (e) {
        return res.status(500).send({
            message: e.message,
            error: true
        })
    }
});

router.get('/profile/:id', async (req, res) => {
    const ip = req.socket.remoteAddress;
    try {
        let user = await get_user_by_token(req.headers.authorization);
        if (user) {
            try {
                let profile = await User.findOne({ _id: req.params.id });
                if (profile) {
                    return res.status(200).send({
                        message: 'User profile retrieved successfully',
                        error: false,
                        data: profile
                    })
                } else {
                    return res.status(400).send({
                        message: 'User not found',
                        error: true
                    })
                }
            } catch (e) {
                return res.status(500).send({
                    message: e.message,
                    error: true
                })
            }
        } else {
            return res.status(400).send({
                message: 'User not found',
                error: true
            })
        }
    } catch (e) {
        return res.status(500).send({
            message: e.message,
            error: true
        })
    }
})


// Company
router.post('/company', async (req, res) => {
    const ip = req.socket.remoteAddress;
    const { name, address, employees } = req.body;
    try {
        const user = await get_user_by_token(req.headers.authorization);
        if (user) {
            let company = await Company.create({
                name: name,
                address: address,
                owner: user._id,
                timestamp: new Date().toISOString()
            })
            for (let i = 0; i < employees.length; i++) {
                try {
                    let employee = await User.findOne({ email: employees[i] });
                    if (employee) {
                        company.employees.push(employee._id);
                    } else {
                        employee = await User.create({
                            email: employees[i],
                            password: employees[i],
                            ip_address: ip,
                            role: 'user',
                            timestamp: new Date().toISOString()
                        })
                        await employee.save();
                        company.employees.push(employee._id);
                        await log(`User created: ${user.email} created ${employees[i]} from ${ip}`);
                    }
                } catch (e) {
                    return res.status(500).send({
                        message: e.message,
                        error: true
                    })
                }
            }
            await company.save();
            await log(`Company created: ${user.email} created ${name} from ${ip}`);
            return res.status(200).send({
                message: 'Company created successfully',
                error: false
            })
        } else {
            return res.status(400).send({
                message: 'User not found',
                error: true
            })
        }
    } catch (e) {
        return res.status(500).send({
            message: e.message,
            error: true
        })
    }
})

router.get('/companies', async (req, res) => {
    try {
        const user = await get_user_by_token(req.headers.authorization);
        if (user) {
            let companies = await Company.find({ owner: user._id });
            return res.status(200).send({
                message: 'Companies retrieved successfully',
                error: false,
                data: companies
            })
        } else {
            return res.status(400).send({
                message: 'User not found',
                error: true
            })
        }
    } catch (e) {
        return res.status(500).send({
            message: e.message,
            error: true
        })
    }
})

router.get('/company/:id', async (req, res) => {
    try {
        const user = await get_user_by_token(req.headers.authorization);
        if (user) {
            let company = await Company.findOne({ _id: req.params.id });
            return res.status(200).send({
                message: 'Company retrieved successfully',
                error: false,
                data: company
            })
        } else {
            return res.status(400).send({
                message: 'User not found',
                error: true
            })
        }
    } catch (e) {
        return res.status(500).send({
            message: e.message,
            error: true
        })
    }
})

router.post('/company/:id/update', async (req, res) => {
    try {
        const user = await get_user_by_token(req.headers.authorization);
        if (user) {
            let company = await Company.findOne({ _id: req.params.id });
            if (company && company.owner.toString() === user._id.toString()) {
                company.name = req.body.name || company.name;
                company.address = req.body.address || company.address;
                let employees = req.body.employees || company.employees;
                company.employees = [];
                for (let i = 0; i < employees.length; i++) {
                    try {
                        let employee = await User.findOne({ email: employees[i] });
                        if (employee) {
                            company.employees.push(employee._id);
                        } else {
                            employee = await User.create({
                                email: employees[i],
                                password: employees[i],
                                ip_address: ip,
                                role: 'user',
                                timestamp: new Date().toISOString()
                            })
                            await employee.save();
                            company.employees.push(employee._id);
                            await log(`User created: ${user.email} created ${employees[i]} from ${ip}`);
                        }
                    } catch (e) {
                        return res.status(500).send({
                            message: e.message,
                            error: true
                        })
                    }
                }
                await company.save();
                await log(`Company updated: ${user.email} updated ${company.name} from ${ip}`);
                return res.status(200).send({
                    message: 'Company updated successfully',
                    error: false
                })
            } else {
                return res.status(400).send({
                    message: 'Company not found',
                    error: true
                })
            }
        } else {
            return res.status(400).send({
                message: 'User not found',
                error: true
            })
        }
    } catch (e) {
        return res.status(500).send({
            message: e.message,
            error: true
        })
    }
})

router.post('/company/:id/delete', async (req, res) => {
    try {
        const user = await get_user_by_token(req.headers.authorization);
        if (user) {
            let company = await Company.findOne({ _id: req.params.id });
            if (company && company.owner.toString() === user._id.toString()) {
                await Company.deleteOne({ _id: req.params.id });
                await log(`Company deleted: ${user.email} deleted ${company.name} from ${ip}`);
                return res.status(200).send({
                    message: 'Company deleted successfully',
                    error: false
                })
            }
        } else {
            return res.status(400).send({
                message: 'User not found',
                error: true
            })
        }
    } catch (e) {
        return res.status(500).send({
            message: e.message,
            error: true
        })
    }
})

router.get('/companies_as_employee', async (req, res) => {
    try {
        const user = await get_user_by_token(req.headers.authorization);
        if (user) {
            let companies = await Company.find({ employees: user._id });
            if (companies) {
                return res.status(200).send({
                    message: 'Companies retrieved successfully',
                    error: false,
                    data: companies
                })
            } else {
                return res.status(400).send({
                    message: 'Company(s) not found',
                    error: true
                })
            }
        } else {
            return res.status(400).send({
                message: 'User not found',
                error: true
            })
        }
    } catch (e) {
        return res.status(500).send({
            message: e.message,
            error: true
        })
    }
})


// Event
router.post('/event', async (req, res) => {
    let ip = req.socket.remoteAddress;
    try {
        const user = await get_user_by_token(req.headers.authorization);
        if (user) {
            try {
                let company = await Company.findOne({ _id: req.body.company });
                if (company && company.owner.toString() === user._id.toString() || company.employees.includes(user._id)) {
                    let event = await Event.create({
                        name: req.body.name,
                        company: req.body.company,
                        attendees: req.body.attendees,
                        event_type: req.body.event_type,
                        timestamp: new Date().toISOString()
                    })
                    await event.save();
                    for (let i = 0; i < req.body.eventDates.length; i++) {
                        let event_date = await EventDate.create({
                            date: req.body.eventDates[i].date,
                            time: req.body.eventDates[i].time,
                            event: event._id,
                            guests: req.body.eventDates[i].guests,
                            price: req.body.eventDates[i].price,
                            status: req.body.eventDates[i].status,
                            notes: req.body.eventDates[i].notes,
                            timestamp: new Date().toISOString()
                        })
                        await event_date.save();
                        await log(`Event Date created: ${user.email} as ${req.body.company} registered ${req.body.event_date} in ${req.body.name} from ${ip}`);
                    }
                    await log(`Event created: ${user.email} as ${req.body.company} created ${req.body.name} from ${ip}`);
                    return res.status(200).send({
                        message: 'Event created successfully',
                        error: false,
                        data: event
                    })
                } else {
                    return res.status(400).send({
                        message: 'Company not found',
                        error: true
                    })
                }
            } catch (e) {
                return res.status(500).send({
                    message: e.message,
                    error: true
                })
            }
        } else {
            return res.status(400).send({
                message: 'User not found',
                error: true
            })
        }
    } catch (e) {
        return res.status(500).send({
            message: e.message,
            error: true
        })
    }
})

router.get('/events/:id', async (req, res) => {
    try {
        const user = await get_user_by_token(req.headers.authorization);
        if (user) {
            try {
                let company = await Company.findOne({ _id: req.params.id });
                if (company && company.owner.toString() === user._id.toString() || company.employees.includes(user._id)) {
                    let events = await Event.find({ company: req.params.id });
                    if (events) {
                        return res.status(200).send({
                            message: 'Events retrieved successfully',
                            error: false,
                            data: events
                        })
                    } else {
                        return res.status(400).send({
                            message: 'Event(s) not found',
                            error: true
                        })
                    }
                } else {
                    return res.status(400).send({
                        message: 'Company not found',
                        error: true
                    })
                }
            } catch (e) {
                return res.status(500).send({
                    message: e.message,
                    error: true
                })
            }
        } else {
            return res.status(400).send({
                message: 'User not found',
                error: true
            })
        }
    } catch (e) {
        return res.status(500).send({
            message: e.message,
            error: true
        })
    }
})

router.get('/event/:id', async (req, res) => {
    try {
        const user = await get_user_by_token(req.headers.authorization);
        if (user) {
            try {
                let company = await Company.findOne({ _id: req.params.id });
                if (company && company.owner.toString() === user._id.toString() || company.employees.includes(user._id)) {
                    let event = await Event.findOne({ _id: req.params.id });
                    if (event) {
                        return res.status(200).send({
                            message: 'Event retrieved successfully',
                            error: false,
                            data: event
                        })
                    } else {
                        return res.status(400).send({
                            message: 'Event not found',
                            error: true
                        })
                    }
                } else {
                    return res.status(400).send({
                        message: 'Company not found',
                        error: true
                    })
                }
            } catch (e) {
                return res.status(500).send({
                    message: e.message,
                    error: true
                })
            }
        } else {
            return res.status(400).send({
                message: 'User not found',
                error: true
            })
        }
    } catch (e) {
        return res.status(500).send({
            message: e.message,
            error: true
        })
    }
})

router.post('/event/:id/update', async (req, res) => {
    try {
        const user = await get_user_by_token(req.headers.authorization);
        if (user) {
            let company = await Company.findOne({ _id: req.params.id });
            if (company && company.owner.toString() === user._id.toString() || company.employees.includes(user._id)) {
                await Event.updateOne({ _id: req.params.id }, req.body);
                await log(`Event updated: ${user.email} updated ${req.params.id} in ${ip}`);
                return res.status(200).send({
                    message: 'Event updated successfully',
                    error: false
                })
            } else {
                return res.status(400).send({
                    message: 'Company not found',
                    error: true
                })
            }
        } else {
            return res.status(400).send({
                message: 'User not found',
                error: true
            })
        }
    } catch (e) {
        return res.status(500).send({
            message: e.message,
            error: true
        })
    }
})

router.post('/event/:id/delete', async (req, res) => {
    try {
        const user = await get_user_by_token(req.headers.authorization);
        if (user) {
            let company = await Company.findOne({ _id: req.params.id });
            if (company && company.owner.toString() === user._id.toString() || company.employees.includes(user._id)) {
                await Event.deleteOne({ _id: req.params.id });
                await log(`Event deleted: ${user.email} deleted ${req.params.id} from ${ip}`);
                return res.status(200).send({
                    message: 'Event deleted successfully',
                    error: false
                })
            } else {
                return res.status(400).send({
                    message: 'Company not found',
                    error: true
                })
            }
        } else {
            return res.status(400).send({
                message: 'User not found',
                error: true
            })
        }
    } catch (e) {
        return res.status(500).send({
            message: e.message,
            error: true
        })
    }
})


module.exports = router