
module.exports = {
	s1: {
		transitions: {
			e2 : 's2',
			e3 : 's3'
		},
		enter : function () {},
		exit  : function () {}
	},

	s2: {
		transitions: {
			e1 : 's1',
			e3 : 's3'
		},
		enter : function () {},
		exit  : function () {}
	},

	s3: {
		transitions: {
			e1 : 's1',
			e2 : 's2'
		},
		enter : function () {},
		exit  : function () {}
	}
}
