"""empty message

Revision ID: 65daf2256cbe
Create Date: 2018-09-28 01:54:19.514091

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '65daf2256cbe'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        'attestation',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column(
            'method',
            sa.Enum('PHONE', 'EMAIL', 'AIRBNB', 'FACEBOOK', 'TWITTER', name='attestationtypes'),
            nullable=True
        ),
        sa.Column('eth_address', sa.String(), nullable=True),
        sa.Column('value', sa.String(), nullable=True),
        sa.Column('signature', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('attestation')
    # ### end Alembic commands ###
