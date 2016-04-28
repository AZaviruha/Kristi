module.exports = {
	s1: {
		transitions: {
			e2 : 's2',
			e3 : 's3'
		},
		coming  : function () {},
		leaving : function () {
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
		coming  : function () {
			return new Promise(function (resolve) {
				setTimeout(function () { resolve(); }, 500);
			});
		},
		leaving : function () {}
	},

	s3: {
		transitions: {
			e1 : 's1',
			e2 : 's2'
		},
		coming  : function () {},
		leaving : function () {}
	}
}
