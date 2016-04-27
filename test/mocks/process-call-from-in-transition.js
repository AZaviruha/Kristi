module.exports = {
	s1: {
		transitions: {
			e2 : 's2',
			e3 : 's3'
		},
		enter : function () {},
		exit  : function () {
			return new Promise(function (resolve) {
				setTimeout(function () { resolve(); }, 500);
			});
		}
	},

	s2: {
		transitions: {
			e1 : 's1',
			e3 : 's3'
		},
		enter : function () {
			return new Promise(function (resolve) {
				setTimeout(function () { resolve(); }, 500);
			});
		},
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
